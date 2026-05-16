"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getAccessToken } from "@/lib/auth/auth";
import type { Message } from "@/lib/api/inbox";

const WS_BASE =
  (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000")
    .replace(/^https/, "wss")
    .replace(/^http/, "ws");

// Reconnect delays: 3s → 6s → 12s → 30s max
const RETRY_DELAYS = [3000, 6000, 12000, 30000];

interface UseWebSocketReturn {
  messages: Message[];
  isConnected: boolean;
  sendMessage: (content: string) => void;
  markAsRead: (messageId: number) => void;
}

export function useWebSocket(conversationId: number): UseWebSocketReturn {
  const wsRef        = useRef<WebSocket | null>(null);
  const retryRef     = useRef(0);
  const unmountedRef = useRef(false);

  const [messages,    setMessages]    = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    unmountedRef.current = false;

    function connect() {
      if (unmountedRef.current) return;

      const token = getAccessToken();
      const url   = `${WS_BASE}/ws/chat/${conversationId}/?token=${token ?? ""}`;
      const ws    = new WebSocket(url);
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
            | { type: "typing"; user_id: number; username: string; is_typing: boolean }
            | { type: "error"; message: string };

          if (data.type === "history") {
            setMessages(data.messages);
          } else if (data.type === "chat_message") {
            setMessages((prev) => [...prev, data.message]);
          } else if (data.type === "message_status") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === data.message_id ? { ...m, status: data.status } : m,
              ),
            );
          } else if (data.type === "batch_status") {
            // Batch read/delivered receipt from the other participant
            setMessages((prev) =>
              prev.map((m) => ({ ...m, status: data.status })),
            );
          }
          // typing events are not stored in state — callers can extend if needed
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

      ws.onerror = () => {
        ws.close(); // triggers onclose → reconnect
      };
    }

    connect();

    return () => {
      unmountedRef.current = true;
      wsRef.current?.close();
      setIsConnected(false);
    };
  }, [conversationId]);

  const sendMessage = useCallback((content: string) => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "message", content }));
    }
  }, []);

  const markAsRead = useCallback((messageId: number) => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "mark_read", message_id: messageId }));
    }
  }, []);

  return { messages, isConnected, sendMessage, markAsRead };
}
