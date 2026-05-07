"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/lib/auth/useAuth";
import { BackButton } from "@/components/ui/BackButton";
import {
  getConversations,
  markMessageRead,
  type Conversation,
  type ConversationParticipant,
  type Message,
} from "@/lib/api/inbox";
import { NetworkError } from "@/lib/api/client";
import { useWebSocket } from "@/lib/hooks/useWebSocket";
import { cn } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (diffMin < 1)  return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24)  return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7)  return `${diffDay}d ago`;
  return d.toLocaleDateString("en-ZW", { day: "numeric", month: "short" });
}

function formatMessageTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-ZW", { hour: "2-digit", minute: "2-digit" });
}

function getOther(conv: Conversation, myId: number): ConversationParticipant {
  return conv.participants.find((p) => p.id !== myId) ?? conv.participants[0];
}

function initial(username: string): string {
  return username.charAt(0).toUpperCase();
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ username, src, size = "md" }: { username: string; src?: string | null; size?: "sm" | "md" | "lg" }) {
  const sz = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-12 w-12 text-base" }[size];
  return (
    <span className={cn("relative flex shrink-0 items-center justify-center rounded-full bg-apple-blue/10 font-bold text-apple-blue overflow-hidden", sz)}>
      {src
        ? <Image src={src} alt={username} fill className="object-cover" />
        : initial(username)}
    </span>
  );
}

// ─── Conversation row ─────────────────────────────────────────────────────────

function ConversationRow({ conv, active, myId, onClick }: {
  conv: Conversation;
  active: boolean;
  myId: number;
  onClick: () => void;
}) {
  const other = getOther(conv, myId);
  const unread = conv.unread_count;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors",
        active
          ? "bg-light-gray border-l-2 border-apple-blue"
          : "hover:bg-gray-50 border-l-2 border-transparent",
      )}
    >
      <div className="relative shrink-0">
        <Avatar username={other.username} src={other.profile_picture} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-apple-blue text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className={cn("text-sm truncate", unread > 0 ? "font-semibold text-gray-900" : "font-medium text-gray-700")}>
            {other.username}
          </p>
          <span className="shrink-0 text-xs text-gray-400">{formatTime(conv.updated_at)}</span>
        </div>
        {conv.listing && (
          <p className="text-xs text-gray-400 truncate">{conv.listing.title}</p>
        )}
        {conv.last_message && (
          <p className={cn("text-sm truncate mt-0.5", unread > 0 ? "text-gray-800" : "text-gray-500")}>
            {conv.last_message.sender.id === myId ? "You: " : ""}
            {conv.last_message.content}
          </p>
        )}
      </div>
    </button>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function Bubble({ msg, isMe }: { msg: Message; isMe: boolean }) {
  return (
    <div className={cn("flex items-end gap-2 max-w-[80%]", isMe ? "ml-auto flex-row-reverse" : "mr-auto")}>
      <div className={cn(
        "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
        isMe
          ? "rounded-br-sm bg-apple-blue text-white"
          : "rounded-bl-sm bg-white border border-gray-100 text-gray-800 shadow-sm",
      )}>
        <p>{msg.content}</p>
        <p className={cn("mt-1 text-right text-[11px]", isMe ? "text-white/50" : "text-gray-400")}>
          {formatMessageTime(msg.created_at)}
          {isMe && <span className="ml-1">{msg.is_read ? "✓✓" : "✓"}</span>}
        </p>
      </div>
    </div>
  );
}

// ─── Chat header ─────────────────────────────────────────────────────────────

function ChatHeader({ conv, myId, isConnected, onBack }: {
  conv: Conversation;
  myId: number;
  isConnected: boolean;
  onBack: () => void;
}) {
  const other = getOther(conv, myId);

  return (
    <div className="flex items-center gap-3 border-b border-gray-100 bg-white px-4 py-3 shrink-0">
      <button
        type="button"
        onClick={onBack}
        className="md:hidden flex items-center justify-center rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 transition-colors"
        aria-label="Back"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
          <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
        </svg>
      </button>

      <div className="relative">
        <Avatar username={other.username} src={other.profile_picture} />
        <span className={cn(
          "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white",
          isConnected ? "bg-apple-blue" : "bg-gray-300",
        )} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">{other.username}</p>
        {conv.listing && (
          <Link href={`/listings/${conv.listing.id}`} className="text-xs text-apple-blue hover:underline truncate block">
            {conv.listing.title}
          </Link>
        )}
      </div>

      {conv.listing?.primary_image && (
        <Link href={`/listings/${conv.listing.id}`} className="hidden sm:block shrink-0">
          <div className="relative h-10 w-14 rounded-lg overflow-hidden bg-gray-100">
            <Image src={conv.listing.primary_image} alt={conv.listing.title} fill className="object-cover" />
          </div>
        </Link>
      )}
    </div>
  );
}

// ─── Message input ────────────────────────────────────────────────────────────

function MessageInput({ onSend, disabled }: { onSend: (text: string) => void; disabled?: boolean }) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const text = value.trim();
    if (!text) return;
    onSend(text);
    setValue("");
    if (ref.current) ref.current.style.height = "auto";
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
  }

  function onInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  return (
    <form onSubmit={submit} className="flex items-end gap-3 border-t border-gray-100 bg-white px-4 py-3 shrink-0">
      <textarea
        ref={ref}
        rows={1}
        value={value}
        onChange={onInput}
        onKeyDown={onKeyDown}
        placeholder="Type a message… (Enter to send)"
        disabled={disabled}
        className={cn(
          "flex-1 resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900",
          "placeholder:text-gray-400 leading-relaxed max-h-40 overflow-y-auto",
          "focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-apple-blue transition-colors",
          "disabled:opacity-50",
        )}
      />
      <button
        type="submit"
        disabled={!value.trim() || disabled}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-apple-blue text-white hover:bg-apple-blue active:scale-95 disabled:opacity-40 transition-all duration-75"
        aria-label="Send message"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 rotate-90 -translate-x-px">
          <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.414 4.926A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.897 28.897 0 0 0 15.293-7.155.75.75 0 0 0 0-1.114A28.897 28.897 0 0 0 3.105 2.288Z" />
        </svg>
      </button>
    </form>
  );
}

// ─── Chat thread (WebSocket-connected) ───────────────────────────────────────

function ChatThread({ conv, myId, onBack }: { conv: Conversation; myId: number; onBack: () => void }) {
  const { messages, isConnected, sendMessage, markAsRead } = useWebSocket(conv.id);
  const endRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Mark latest unread message as read when thread is open
  useEffect(() => {
    const unread = messages.filter((m) => m.sender.id !== myId && !m.is_read);
    if (unread.length === 0) return;
    const last = unread[unread.length - 1];
    markAsRead(last.id);
    markMessageRead(last.id).catch(() => {});
  }, [messages, myId, markAsRead]);

  const firstMessageDate = messages[0]?.created_at;

  return (
    <>
      <ChatHeader conv={conv} myId={myId} isConnected={isConnected} onBack={onBack} />

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {firstMessageDate && (
          <div className="flex items-center gap-3 my-2">
            <div className="flex-1 border-t border-gray-200" />
            <span className="text-xs text-gray-400 shrink-0">
              {new Date(firstMessageDate).toLocaleDateString("en-ZW", { weekday: "long", day: "numeric", month: "long" })}
            </span>
            <div className="flex-1 border-t border-gray-200" />
          </div>
        )}

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-gray-400">
              {isConnected ? "No messages yet. Say hello!" : "Connecting…"}
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <Bubble key={msg.id} msg={msg} isMe={msg.sender.id === myId} />
        ))}

        <div ref={endRef} />
      </div>

      <MessageInput onSend={sendMessage} disabled={!isConnected} />
    </>
  );
}

// ─── Empty states ─────────────────────────────────────────────────────────────

function EmptyInbox() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-light-gray mb-4">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-8 w-8 text-apple-blue">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-gray-700">No messages yet</p>
      <p className="mt-1 text-xs text-gray-400 max-w-xs">
        When someone contacts you about a listing, the conversation will appear here.
      </p>
      <Link href="/listings" className="mt-5 rounded-lg bg-apple-blue px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity">
        Browse Listings
      </Link>
    </div>
  );
}

function NothingSelected() {
  return (
    <div className="hidden md:flex flex-col items-center justify-center h-full text-center px-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-8 w-8 text-gray-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
        </svg>
      </div>
      <p className="text-sm font-medium text-gray-500">Select a conversation to read messages</p>
    </div>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function ListSkeleton() {
  return (
    <>
      {[1, 2, 3, 4, 5].map((n) => (
        <div key={n} className="flex gap-3 px-4 py-4 border-b border-gray-50">
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-gray-100" />
          <div className="flex-1 space-y-2">
            <div className="flex justify-between gap-2">
              <div className="h-3 w-28 animate-pulse rounded bg-gray-100" />
              <div className="h-3 w-10 animate-pulse rounded bg-gray-100" />
            </div>
            <div className="h-3 w-40 animate-pulse rounded bg-gray-100" />
            <div className="h-3 w-32 animate-pulse rounded bg-gray-100" />
          </div>
        </div>
      ))}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const { user } = useAuth();
  const myId = (user as { id?: number } | null)?.id ?? 0;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [hasMore, setHasMore]             = useState(false);
  const [page, setPage]                   = useState(1);
  const [loading, setLoading]             = useState(true);
  const [loadingMore, setLoadingMore]     = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [search, setSearch]         = useState("");
  const [showList, setShowList]     = useState(true);

  const loadConversations = useCallback(async (p: number, append = false) => {
    if (append) setLoadingMore(true); else setLoading(true);
    setError(null);
    try {
      const data = await getConversations(p);
      setConversations((prev) => append ? [...prev, ...data.results] : data.results);
      setHasMore(data.next !== null);
      setPage(p);
    } catch (err) {
      setError(err instanceof NetworkError
        ? "Unable to connect to server."
        : "Couldn't load conversations right now. Please try again.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadConversations(1);
  }, [loadConversations]);

  function openConversation(conv: Conversation) {
    setActiveConv(conv);
    setShowList(false);
    // Optimistically clear unread badge
    setConversations((prev) =>
      prev.map((c) => c.id === conv.id ? { ...c, unread_count: 0 } : c),
    );
  }

  function handleBack() {
    setShowList(true);
    setActiveConv(null);
  }

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0);

  const filtered = conversations.filter((c) => {
    const q = search.toLowerCase();
    if (!q) return true;
    const other = getOther(c, myId);
    return (
      other.username.toLowerCase().includes(q) ||
      (c.listing?.title.toLowerCase().includes(q) ?? false)
    );
  });

  return (
    <div className="flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <BackButton href="/dashboard" label="Dashboard" className="-ml-1 mb-1" />
          <h1 className="text-xl font-semibold text-gray-900">
            Messages
            {totalUnread > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-apple-blue/10 px-2 py-0.5 text-xs font-bold text-apple-blue">
                {totalUnread} new
              </span>
            )}
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {loading ? "Loading…" : `${conversations.length} conversation${conversations.length !== 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      <div className="flex h-[calc(100dvh-11rem)] rounded-2xl border border-gray-100 overflow-hidden shadow-sm bg-white">

        {/* ── Conversation list ── */}
        <div className={cn(
          "flex flex-col w-full md:w-80 lg:w-96 shrink-0 border-r border-gray-100",
          showList ? "flex" : "hidden md:flex",
        )}>
          <div className="border-b border-gray-100 p-3">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
              </svg>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations…"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-apple-blue transition-colors"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {loading ? (
              <ListSkeleton />
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-red-400" aria-hidden="true">
                    <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-sm text-gray-700 font-medium">{error}</p>
                <button
                  type="button"
                  onClick={() => loadConversations(1)}
                  className="rounded-lg bg-apple-blue px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
                >
                  Try again
                </button>
              </div>
            ) : filtered.length === 0 ? (
              conversations.length === 0
                ? <EmptyInbox />
                : <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                    <p className="text-sm text-gray-500">No conversations match your search.</p>
                  </div>
            ) : (
              <>
                {filtered.map((conv) => (
                  <ConversationRow
                    key={conv.id}
                    conv={conv}
                    active={activeConv?.id === conv.id}
                    myId={myId}
                    onClick={() => openConversation(conv)}
                  />
                ))}
                {hasMore && (
                  <div className="p-3">
                    <button
                      type="button"
                      onClick={() => loadConversations(page + 1, true)}
                      disabled={loadingMore}
                      className="w-full rounded-lg border border-gray-200 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                      {loadingMore ? "Loading…" : "Load more"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Chat thread ── */}
        <div className={cn(
          "flex flex-col flex-1 min-w-0 bg-gray-50",
          !showList ? "flex" : "hidden md:flex",
        )}>
          {activeConv && myId ? (
            <ChatThread key={activeConv.id} conv={activeConv} myId={myId} onBack={handleBack} />
          ) : (
            <NothingSelected />
          )}
        </div>
      </div>
    </div>
  );
}
