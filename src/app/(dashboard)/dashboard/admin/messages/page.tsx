"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/lib/auth/useAuth";
import {
  getConversations,
  markMessageRead,
  type Conversation,
  type ConversationParticipant,
  type Message,
} from "@/lib/api/inbox";
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

function initial(username: string): string {
  return username.charAt(0).toUpperCase();
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({
  username,
  src,
  size = "md",
}: {
  username: string;
  src?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
}) {
  const sz = {
    xs: "h-6 w-6 text-[10px]",
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
  }[size];
  return (
    <span className={cn(
      "relative flex shrink-0 items-center justify-center rounded-full bg-apple-blue/10 font-bold text-apple-blue overflow-hidden",
      sz,
    )}>
      {src
        ? <Image src={src} alt={username} fill className="object-cover" />
        : initial(username)}
    </span>
  );
}

// ─── Connection status ────────────────────────────────────────────────────────

function ConnectionStatus({ connected }: { connected: boolean | null }) {
  if (connected === null) return null;
  return (
    <div className={cn(
      "flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold transition-all",
      connected
        ? "bg-green-50 text-green-700"
        : "bg-amber-50 text-amber-700",
    )}>
      <span className={cn(
        "relative flex h-2 w-2 shrink-0",
      )}>
        <span className={cn(
          "absolute inline-flex h-full w-full rounded-full opacity-75",
          connected ? "animate-ping bg-green-500" : "bg-amber-400",
        )} />
        <span className={cn(
          "relative inline-flex h-2 w-2 rounded-full",
          connected ? "bg-green-500" : "bg-amber-500",
        )} />
      </span>
      {connected ? "Live — messages delivered in real time" : "Reconnecting to real-time channel…"}
    </div>
  );
}

// ─── Participants strip ───────────────────────────────────────────────────────

function ParticipantsStrip({ participants }: { participants: ConversationParticipant[] }) {
  return (
    <div className="flex items-center gap-1.5">
      {participants.slice(0, 3).map((p, i) => (
        <div key={p.id} className={cn("relative", i > 0 && "-ml-2")}>
          <Avatar username={p.username} src={p.profile_picture} size="xs" />
        </div>
      ))}
      {participants.length > 3 && (
        <span className="text-[11px] text-gray-400">+{participants.length - 3}</span>
      )}
    </div>
  );
}

// ─── Conversation row ─────────────────────────────────────────────────────────

function ConversationRow({
  conv,
  active,
  myId,
  onClick,
}: {
  conv: Conversation;
  active: boolean;
  myId: number;
  onClick: () => void;
}) {
  const other = conv.participants.find((p) => p.id !== myId) ?? conv.participants[0];
  const unread = conv.unread_count;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors border-l-2",
        active
          ? "bg-light-gray border-apple-blue"
          : "hover:bg-gray-50 border-transparent",
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
          <p className={cn(
            "truncate text-sm",
            unread > 0 ? "font-semibold text-gray-900" : "font-medium text-gray-700",
          )}>
            {conv.participants.map((p) => p.username).join(" & ")}
          </p>
          <span className="shrink-0 text-xs text-gray-400">{formatTime(conv.updated_at)}</span>
        </div>
        {conv.listing && (
          <p className="mt-0.5 truncate text-xs text-gray-400">{conv.listing.title}</p>
        )}
        {conv.last_message && (
          <p className={cn(
            "mt-0.5 truncate text-xs",
            unread > 0 ? "text-gray-700" : "text-gray-400",
          )}>
            <span className="font-medium text-gray-600">{conv.last_message.sender.username}:</span>{" "}
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
    <div className={cn("flex max-w-[78%] flex-col gap-1", isMe ? "ml-auto items-end" : "mr-auto items-start")}>
      <span className="text-[11px] font-semibold text-gray-500">{msg.sender.username}</span>
      <div className={cn(
        "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
        isMe
          ? "rounded-br-sm bg-apple-blue text-white"
          : "rounded-bl-sm border border-gray-100 bg-white text-gray-800 shadow-sm",
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

// ─── Chat header ──────────────────────────────────────────────────────────────

function ChatHeader({
  conv,
  myId,
  isConnected,
  onBack,
}: {
  conv: Conversation;
  myId: number;
  isConnected: boolean;
  onBack: () => void;
}) {
  const other = conv.participants.find((p) => p.id !== myId) ?? conv.participants[0];

  return (
    <div className="flex shrink-0 items-center gap-3 border-b border-gray-100 bg-white px-4 py-3">
      {/* Mobile back */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center justify-center rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 transition-colors md:hidden"
        aria-label="Back"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
          <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Stacked avatars */}
      <div className="relative shrink-0">
        <div className="relative">
          <Avatar username={other.username} src={other.profile_picture} />
          {/* Connection dot */}
          <span className={cn(
            "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white",
            isConnected ? "bg-green-500" : "bg-gray-300",
          )} />
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          {conv.participants.map((p) => (
            <span key={p.id} className="text-sm font-semibold text-gray-900">
              @{p.username}
            </span>
          ))}
        </div>
        {conv.listing ? (
          <Link
            href={`/listings/${conv.listing.id}`}
            className="block truncate text-xs text-apple-blue hover:underline"
          >
            {conv.listing.title}
          </Link>
        ) : (
          <p className="text-xs text-gray-400">Direct conversation</p>
        )}
      </div>

      {/* Listing thumbnail */}
      {conv.listing?.primary_image && (
        <Link href={`/listings/${conv.listing.id}`} className="hidden shrink-0 sm:block">
          <div className="relative h-10 w-14 overflow-hidden rounded-lg bg-gray-100">
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

  return (
    <form
      onSubmit={submit}
      className="flex shrink-0 items-end gap-3 border-t border-gray-100 bg-white px-4 py-3"
    >
      <textarea
        ref={ref}
        rows={1}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          const el = e.target;
          el.style.height = "auto";
          el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
        }}
        placeholder={disabled ? "Connecting…" : "Reply as admin… (Enter to send)"}
        disabled={disabled}
        className={cn(
          "max-h-40 flex-1 resize-none overflow-y-auto rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5",
          "text-sm leading-relaxed text-gray-900 placeholder:text-gray-400",
          "focus:border-apple-blue focus:outline-none focus:ring-2 focus:ring-apple-blue transition-colors",
          "disabled:opacity-50",
        )}
      />
      <button
        type="submit"
        disabled={!value.trim() || disabled}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-apple-blue text-white hover:opacity-90 active:scale-95 disabled:opacity-40 transition-all duration-75"
        aria-label="Send"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="-translate-x-px h-5 w-5 rotate-90">
          <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.414 4.926A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.897 28.897 0 0 0 15.293-7.155.75.75 0 0 0 0-1.114A28.897 28.897 0 0 0 3.105 2.288Z" />
        </svg>
      </button>
    </form>
  );
}

// ─── Chat thread ──────────────────────────────────────────────────────────────

function ChatThread({
  conv,
  myId,
  onBack,
  onConnectionChange,
}: {
  conv: Conversation;
  myId: number;
  onBack: () => void;
  onConnectionChange: (connected: boolean) => void;
}) {
  const { messages, isConnected, sendMessage, markAsRead } = useWebSocket(conv.id);
  const endRef = useRef<HTMLDivElement>(null);

  // Report connection state up to page
  useEffect(() => {
    onConnectionChange(isConnected);
  }, [isConnected, onConnectionChange]);

  // Auto-scroll on new messages
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Mark latest unread as read when thread is open
  useEffect(() => {
    const unread = messages.filter((m) => m.sender.id !== myId && !m.is_read);
    if (unread.length === 0) return;
    const last = unread[unread.length - 1];
    markAsRead(last.id);
    markMessageRead(last.id).catch(() => {});
  }, [messages, myId, markAsRead]);

  return (
    <>
      <ChatHeader conv={conv} myId={myId} isConnected={isConnected} onBack={onBack} />
      <ConnectionStatus connected={isConnected} />

      <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50 px-4 py-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-gray-400">
              {isConnected ? "No messages yet." : "Connecting…"}
            </p>
          </div>
        )}

        {messages.map((msg, i) => {
          const prevMsg = i > 0 ? messages[i - 1] : null;
          const showDateDivider =
            !prevMsg ||
            new Date(msg.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString();

          return (
            <div key={msg.id}>
              {showDateDivider && (
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 border-t border-gray-200" />
                  <span className="shrink-0 text-xs text-gray-400">
                    {new Date(msg.created_at).toLocaleDateString("en-ZW", {
                      weekday: "long", day: "numeric", month: "long",
                    })}
                  </span>
                  <div className="flex-1 border-t border-gray-200" />
                </div>
              )}
              <Bubble msg={msg} isMe={msg.sender.id === myId} />
            </div>
          );
        })}

        <div ref={endRef} />
      </div>

      <MessageInput onSend={sendMessage} disabled={!isConnected} />
    </>
  );
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function ListSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex gap-3 border-b border-gray-50 px-4 py-4">
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-gray-100" />
          <div className="flex-1 space-y-2">
            <div className="flex justify-between gap-2">
              <div className="h-3 w-28 animate-pulse rounded bg-gray-100" />
              <div className="h-3 w-10 animate-pulse rounded bg-gray-100" />
            </div>
            <div className="h-3 w-36 animate-pulse rounded bg-gray-100" />
            <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
          </div>
        </div>
      ))}
    </>
  );
}

// ─── Empty / idle states ──────────────────────────────────────────────────────

function EmptyInbox() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-7 w-7 text-gray-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-gray-700">No conversations yet</p>
      <p className="mt-1 text-xs text-gray-400 max-w-xs">
        Conversations between you and platform users will appear here.
      </p>
    </div>
  );
}

function NothingSelected() {
  return (
    <div className="hidden flex-col items-center justify-center px-6 text-center md:flex h-full">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-8 w-8 text-gray-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
        </svg>
      </div>
      <p className="text-sm font-medium text-gray-500">Select a conversation to read messages</p>
      <p className="mt-1 text-xs text-gray-400">Real-time connection opens when you select a chat.</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminMessagesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const isAdmin = user?.role === "ADMIN" || user?.role === "MODERATOR";
  const myId = (user as { id?: number } | null)?.id ?? 0;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [hasMore,        setHasMore]       = useState(false);
  const [page,           setPage]          = useState(1);
  const [loading,        setLoading]       = useState(true);
  const [loadingMore,    setLoadingMore]   = useState(false);

  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [search,     setSearch]     = useState("");
  const [showList,   setShowList]   = useState(true);
  const [connected,  setConnected]  = useState<boolean | null>(null);

  const loadConversations = useCallback(async (p: number, append = false) => {
    if (append) setLoadingMore(true); else setLoading(true);
    try {
      const data = await getConversations(p);
      setConversations((prev) => append ? [...prev, ...data.results] : data.results);
      setHasMore(data.next !== null);
      setPage(p);
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) loadConversations(1);
  }, [isAdmin, loadConversations]);

  function openConversation(conv: Conversation) {
    setActiveConv(conv);
    setShowList(false);
    setConnected(null); // reset until WS reports
    setConversations((prev) =>
      prev.map((c) => c.id === conv.id ? { ...c, unread_count: 0 } : c),
    );
  }

  const handleConnectionChange = useCallback((c: boolean) => {
    setConnected(c);
  }, []);

  const totalUnread = conversations.reduce((s, c) => s + c.unread_count, 0);

  const filtered = conversations.filter((c) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      c.participants.some((p) => p.username.toLowerCase().includes(q)) ||
      (c.listing?.title.toLowerCase().includes(q) ?? false)
    );
  });

  // ─── Auth loading ────────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="flex max-w-5xl flex-col gap-4">
        <div className="h-8 w-48 animate-pulse rounded-xl bg-gray-100" />
        <div className="h-[calc(100dvh-12rem)] animate-pulse rounded-2xl bg-gray-100" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-sm font-semibold text-gray-900">Admin access required</p>
        <p className="mt-1 text-xs text-gray-500">Only admins and moderators can access this page.</p>
      </div>
    );
  }

  return (
    <div className="flex max-w-5xl flex-col gap-4">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            Messages
            {totalUnread > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-apple-blue/10 px-2 py-0.5 text-xs font-bold text-apple-blue">
                {totalUnread} unread
              </span>
            )}
          </h1>
          <p className="mt-0.5 text-xs text-gray-500">
            {loading
              ? "Loading conversations…"
              : `${conversations.length} conversation${conversations.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        <button
          onClick={() => loadConversations(1)}
          disabled={loading}
          className="rounded-full border border-gray-200 px-4 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          {loading ? "Loading…" : "↻ Refresh"}
        </button>
      </div>

      {/* Chat panel */}
      <div className="flex h-[calc(100dvh-11rem)] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">

        {/* ── Sidebar ── */}
        <div className={cn(
          "flex w-full flex-col border-r border-gray-100 md:w-72 lg:w-80 shrink-0",
          showList ? "flex" : "hidden md:flex",
        )}>
          {/* Sidebar header */}
          <div className="border-b border-gray-100 p-3">
            <div className="relative">
              <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
              </svg>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by user or listing…"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-xs text-gray-900 placeholder:text-gray-400 focus:border-apple-blue focus:outline-none focus:ring-2 focus:ring-apple-blue transition-colors"
              />
            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-1 divide-y divide-gray-50 overflow-y-auto">
            {loading ? (
              <ListSkeleton />
            ) : filtered.length === 0 ? (
              conversations.length === 0 ? (
                <EmptyInbox />
              ) : (
                <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
                  <p className="text-sm text-gray-400">No conversations match your search.</p>
                </div>
              )
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
                      className="w-full rounded-xl border border-gray-200 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                      {loadingMore ? "Loading…" : "Load more"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Chat window ── */}
        <div className={cn(
          "flex min-w-0 flex-1 flex-col bg-gray-50",
          !showList ? "flex" : "hidden md:flex",
        )}>
          {activeConv && myId ? (
            <ChatThread
              key={activeConv.id}
              conv={activeConv}
              myId={myId}
              onBack={() => { setShowList(true); setActiveConv(null); setConnected(null); }}
              onConnectionChange={handleConnectionChange}
            />
          ) : (
            <NothingSelected />
          )}
        </div>
      </div>
    </div>
  );
}
