"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/lib/auth/useAuth";
import { BackButton } from "@/components/ui/BackButton";
import {
  getConversations,
  getConversation,
  sendMessage,
  markConversationRead,
  deleteConversation,
  type Conversation,
  type Message,
} from "@/lib/mock/messages";
import { cn } from "@/lib/utils";

// ─── Time formatting ──────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr  = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);
  if (diffMin < 1)  return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr  < 24) return `${diffHr}h ago`;
  if (diffDay < 7)  return `${diffDay}d ago`;
  return d.toLocaleDateString("en-ZW", { day: "numeric", month: "short" });
}

function formatMessageTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-ZW", { hour: "2-digit", minute: "2-digit" });
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({
  initial,
  avatar,
  size = "md",
}: {
  initial: string;
  avatar?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sz = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-12 w-12 text-base" }[size];
  return (
    <span className={cn("relative flex shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-700 overflow-hidden", sz)}>
      {avatar ? <Image src={avatar} alt={initial} fill className="object-cover" /> : initial}
    </span>
  );
}

// ─── Conversation row (list) ──────────────────────────────────────────────────

function ConversationRow({
  conv,
  active,
  onClick,
}: {
  conv: Conversation;
  active: boolean;
  onClick: () => void;
}) {
  const last = conv.messages[conv.messages.length - 1];
  const unread = conv.messages.filter((m) => m.senderId !== "me" && !m.read).length;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors",
        active ? "bg-emerald-50 border-l-2 border-emerald-500" : "hover:bg-gray-50 border-l-2 border-transparent",
      )}
    >
      <div className="relative shrink-0">
        <Avatar initial={conv.contactInitial} avatar={conv.contactAvatar} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className={cn("text-sm truncate", unread > 0 ? "font-semibold text-gray-900" : "font-medium text-gray-700")}>
            {conv.contactName}
          </p>
          <span className="shrink-0 text-xs text-gray-400">{formatTime(conv.updatedAt)}</span>
        </div>
        <p className="text-xs text-gray-400 truncate">{conv.listingTitle}</p>
        {last && (
          <p className={cn("text-sm truncate mt-0.5", unread > 0 ? "text-gray-800" : "text-gray-500")}>
            {last.senderId === "me" ? "You: " : ""}{last.body}
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
      <div
        className={cn(
          "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isMe
            ? "rounded-br-sm bg-emerald-600 text-white"
            : "rounded-bl-sm bg-white border border-gray-100 text-gray-800 shadow-sm",
        )}
      >
        <p>{msg.body}</p>
        <p className={cn("mt-1 text-right text-[11px]", isMe ? "text-emerald-200" : "text-gray-400")}>
          {formatMessageTime(msg.sentAt)}
          {isMe && (
            <span className="ml-1">{msg.read ? "✓✓" : "✓"}</span>
          )}
        </p>
      </div>
    </div>
  );
}

// ─── Chat header ─────────────────────────────────────────────────────────────

function ChatHeader({
  conv,
  onBack,
  onDelete,
}: {
  conv: Conversation;
  onBack: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex items-center gap-3 border-b border-gray-100 bg-white px-4 py-3 shrink-0">
      {/* Back button — mobile only */}
      <button
        type="button"
        onClick={onBack}
        className="md:hidden flex items-center justify-center rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 transition-colors"
        aria-label="Back to conversations"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
          <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
        </svg>
      </button>

      <Avatar initial={conv.contactInitial} avatar={conv.contactAvatar} />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">{conv.contactName}</p>
        <Link
          href={`/listings/${conv.listingId}`}
          className="text-xs text-emerald-600 hover:underline truncate block"
        >
          {conv.listingTitle}
        </Link>
      </div>

      {/* Listing thumbnail */}
      {conv.listingImage && (
        <Link href={`/listings/${conv.listingId}`} className="hidden sm:block shrink-0">
          <div className="relative h-10 w-14 rounded-lg overflow-hidden bg-gray-100">
            <Image src={conv.listingImage} alt={conv.listingTitle} fill className="object-cover" />
          </div>
        </Link>
      )}

      {/* Price */}
      <p className="hidden sm:block shrink-0 text-sm font-bold text-emerald-600">
        {conv.listingCurrency} {conv.listingPrice.toLocaleString()}
      </p>

      {/* Menu */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center justify-center rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 transition-colors"
          aria-label="Conversation options"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
            <path d="M3 10a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM8.5 10a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM15.5 8.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" />
          </svg>
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 w-40 rounded-xl border border-gray-100 bg-white py-1 shadow-lg z-10">
            <Link
              href={`/listings/${conv.listingId}`}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setMenuOpen(false)}
            >
              View listing
            </Link>
            <button
              type="button"
              onClick={() => { setMenuOpen(false); onDelete(); }}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              Delete conversation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Input bar ────────────────────────────────────────────────────────────────

function MessageInput({
  onSend,
  disabled,
}: {
  onSend: (body: string) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const body = value.trim();
    if (!body) return;
    onSend(body);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
    // Auto-grow textarea
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-3 border-t border-gray-100 bg-white px-4 py-3 shrink-0"
    >
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder="Type a message… (Enter to send)"
        disabled={disabled}
        className={cn(
          "flex-1 resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900",
          "placeholder:text-gray-400 leading-relaxed max-h-40 overflow-y-auto",
          "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 transition-colors",
          "disabled:opacity-50",
        )}
      />
      <button
        type="submit"
        disabled={!value.trim() || disabled}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 disabled:opacity-40 transition-all duration-75"
        aria-label="Send message"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 rotate-90 -translate-x-px">
          <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.414 4.926A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.897 28.897 0 0 0 15.293-7.155.75.75 0 0 0 0-1.114A28.897 28.897 0 0 0 3.105 2.288Z" />
        </svg>
      </button>
    </form>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyInbox() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 mb-4">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-8 w-8 text-emerald-500">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-gray-700">No messages yet</p>
      <p className="mt-1 text-xs text-gray-400 max-w-xs">
        When someone contacts you about a listing, the conversation will appear here.
      </p>
      <Link
        href="/listings"
        className="mt-5 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
      >
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId]           = useState<string | null>(null);
  const [active, setActive]               = useState<Conversation | null>(null);
  const [search, setSearch]               = useState("");
  const [showList, setShowList]           = useState(true); // mobile: toggle panel
  const [mounted, setMounted]             = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial load
  useEffect(() => {
    setConversations(getConversations());
    setMounted(true);
  }, []);

  // Load active conversation and mark read
  useEffect(() => {
    if (!activeId) { setActive(null); return; }
    const conv = getConversation(activeId);
    if (!conv) return;
    markConversationRead(activeId);
    const updated = { ...conv, messages: conv.messages.map((m) => ({ ...m, read: true })) };
    setActive(updated);
    setConversations(getConversations());
  }, [activeId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages.length]);

  function openConversation(id: string) {
    setActiveId(id);
    setShowList(false); // on mobile, hide list and show chat
  }

  function handleBack() {
    setShowList(true);
    setActiveId(null);
  }

  function handleSend(body: string) {
    if (!activeId) return;
    const updated = sendMessage(activeId, body);
    setActive(updated);
    setConversations(getConversations());
  }

  function handleDelete(id: string) {
    deleteConversation(id);
    setConversations(getConversations());
    if (activeId === id) { setActiveId(null); setShowList(true); }
  }

  const filtered = conversations.filter((c) =>
    c.contactName.toLowerCase().includes(search.toLowerCase()) ||
    c.listingTitle.toLowerCase().includes(search.toLowerCase()),
  );

  const totalUnread = conversations.reduce(
    (sum, c) => sum + c.messages.filter((m) => m.senderId !== "me" && !m.read).length,
    0,
  );

  if (!mounted) {
    return (
      <div className="flex h-[calc(100dvh-3.5rem-2rem)] gap-0 rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="w-80 shrink-0 border-r border-gray-100 bg-white">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="flex gap-3 px-4 py-4 border-b border-gray-50">
              <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-gray-100" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-28 animate-pulse rounded bg-gray-100" />
                <div className="h-3 w-40 animate-pulse rounded bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex-1 bg-gray-50 hidden md:block" />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Page heading — outside the panel */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <BackButton href="/dashboard" label="Dashboard" className="-ml-1 mb-1" />
          <h1 className="text-xl font-semibold text-gray-900">
            Messages
            {totalUnread > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                {totalUnread} new
              </span>
            )}
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">{conversations.length} conversation{conversations.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Split-pane inbox */}
      <div className="flex h-[calc(100dvh-11rem)] rounded-2xl border border-gray-100 overflow-hidden shadow-sm bg-white">

        {/* ── Conversation list ── */}
        <div
          className={cn(
            "flex flex-col w-full md:w-80 lg:w-96 shrink-0 border-r border-gray-100",
            // mobile: hide when viewing a chat
            showList ? "flex" : "hidden md:flex",
          )}
        >
          {/* Search */}
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
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 transition-colors"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {filtered.length === 0 ? (
              conversations.length === 0 ? <EmptyInbox /> : (
                <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                  <p className="text-sm text-gray-500">No conversations match your search.</p>
                </div>
              )
            ) : (
              filtered.map((conv) => (
                <ConversationRow
                  key={conv.id}
                  conv={conv}
                  active={activeId === conv.id}
                  onClick={() => openConversation(conv.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* ── Chat thread ── */}
        <div
          className={cn(
            "flex flex-col flex-1 min-w-0 bg-gray-50",
            !showList ? "flex" : "hidden md:flex",
          )}
        >
          {active ? (
            <>
              {/* Header */}
              <ChatHeader
                conv={active}
                onBack={handleBack}
                onDelete={() => handleDelete(active.id)}
              />

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {/* Date separator */}
                {active.messages.length > 0 && (
                  <div className="flex items-center gap-3 my-2">
                    <div className="flex-1 border-t border-gray-200" />
                    <span className="text-xs text-gray-400 shrink-0">
                      {new Date(active.messages[0].sentAt).toLocaleDateString("en-ZW", { weekday: "long", day: "numeric", month: "long" })}
                    </span>
                    <div className="flex-1 border-t border-gray-200" />
                  </div>
                )}

                {active.messages.map((msg) => (
                  <Bubble key={msg.id} msg={msg} isMe={msg.senderId === "me"} />
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <MessageInput onSend={handleSend} />
            </>
          ) : (
            <NothingSelected />
          )}
        </div>
      </div>
    </div>
  );
}
