"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getAccessToken } from "@/lib/auth/auth";
import type { Message } from "@/lib/api/inbox";

const WS_BASE =
  (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000")
    .replace(/^https/, "wss")
    .replace(/^http/, "ws");

const RETRY_DELAYS = [3000, 6000, 12000, 30000];

interface UseWebSocketReturn {
  isConnected: boolean;
  markAsRead: (messageId: number) => void;
}

/**
 * Manages the WebSocket connection for a conversation.
 * Message state is owned by the caller — pass callbacks to receive events.
 *
 * @param onNewMessage  Called when another participant sends a message via WS.
 * @param onStatusUpdate Called when a message status changes (read/delivered).
 */
export function useWebSocket(
  conversationId: number,
  onNewMessage: (msg: Message) => void,
  onStatusUpdate?: (messageId: number, status: string) => void,
): UseWebSocketReturn {
  const wsRef         = useRef<WebSocket | null>(null);
  const retryRef      = useRef(0);
  const unmountedRef  = useRef(false);
  const callbacksRef  = useRef({ onNewMessage, onStatusUpdate });
  callbacksRef.current = { onNewMessage, onStatusUpdate };

  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    unmountedRef.current = false;

    function connect() {
      if (unmountedRef.current) return;

      const token = getAccessToken();
      if (!token) {
        // Retry shortly — token may not be set yet (auth initializing)
        setTimeout(connect, 1000);
        return;
      }

      const url = `${WS_BASE}/ws/chat/${conversationId}/?token=${token}`;
      const ws  = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (unmountedRef.current) { ws.close(); return; }
        setIsConnected(true);
        retryRef.current = 0;
      };

      ws.onmessage = (event: MessageEvent<string>) => {
        if (unmountedRef.current) return;
        try {
          const data = JSON.parse(event.data) as
            | { type: "history"; messages: Message[] }
            | { type: "chat_message"; message: Message }
            | { type: "message_status"; message_id: number; status: string }
            | { type: "batch_status"; status: string; reader_id: number }
            | { type: "typing" | "error" };

          if (data.type === "chat_message") {
            callbacksRef.current.onNewMessage(data.message);
          } else if (data.type === "message_status") {
            callbacksRef.current.onStatusUpdate?.(data.message_id, data.status);
          }
          // history and batch_status are informational — REST is source of truth
        } catch {
          // ignore malformed frames
        }
      };

      ws.onclose = () => {
        if (unmountedRef.current) return;
        setIsConnected(false);
        const delay = RETRY_DELAYS[Math.min(retryRef.current, RETRY_DELAYS.length - 1)];
        retryRef.current += 1;
        setTimeout(connect, delay);
      };

      ws.onerror = () => { ws.close(); };
    }

    connect();

    return () => {
      unmountedRef.current = true;
      wsRef.current?.close();
      setIsConnected(false);
    };
  }, [conversationId]);

  const markAsRead = useCallback((messageId: number) => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "mark_read", message_id: messageId }));
    }
  }, []);

  return { isConnected, markAsRead };
}
