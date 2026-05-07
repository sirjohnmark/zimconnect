import { api } from "./client";
import { getStoredUser } from "@/lib/auth/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ConversationParticipant {
  id: number;
  username: string;
  profile_picture: string | null;
}

export interface ConversationListing {
  id: number;
  title: string;
  primary_image: string | null;
}

export interface Message {
  id: number;
  sender: ConversationParticipant;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  id: number;
  participants: ConversationParticipant[];
  listing: ConversationListing | null;
  last_message: Message | null;
  unread_count: number;
  updated_at: string;
  /** Only present when fetching conversation detail */
  messages?: Message[];
}

export interface PaginatedConversations {
  count: number;
  next: string | null;
  previous: string | null;
  results: Conversation[];
}

export interface StartConversationBody {
  participant_id: number;
  listing_id?: number;
}

// ─── Mock helpers ─────────────────────────────────────────────────────────────

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

let _mockConversations: Conversation[] = [];

function getMockSelf(): ConversationParticipant {
  const user = getStoredUser();
  return { id: user?.id ?? 1, username: user?.username ?? "me", profile_picture: null };
}

function mockConversation(id: number, otherUsername: string, lastMsg: string): Conversation {
  const other: ConversationParticipant = { id: id + 100, username: otherUsername, profile_picture: null };
  const msg: Message = {
    id: id * 10,
    sender: other,
    content: lastMsg,
    is_read: false,
    created_at: new Date(Date.now() - id * 3_600_000).toISOString(),
  };
  return {
    id,
    participants: [getMockSelf(), other],
    listing: null,
    last_message: msg,
    messages: [msg],
    unread_count: 1,
    updated_at: msg.created_at,
  };
}

function initMock() {
  if (_mockConversations.length === 0) {
    _mockConversations = [
      mockConversation(1, "buyer_alice", "Is this still available?"),
      mockConversation(2, "seller_bob",  "Yes, I can deliver tomorrow."),
    ];
  }
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

export async function getConversations(page = 1): Promise<PaginatedConversations> {
  if (USE_MOCK) {
    initMock();
    const pageSize = 10;
    const start = (page - 1) * pageSize;
    const results = _mockConversations.slice(start, start + pageSize);
    return { count: _mockConversations.length, next: null, previous: null, results };
  }
  return api.get<PaginatedConversations>("/api/v1/inbox", { params: { page } });
}

export async function getConversation(id: number): Promise<Conversation> {
  if (USE_MOCK) {
    initMock();
    const conv = _mockConversations.find((c) => c.id === id);
    if (!conv) throw new Error("Conversation not found");
    return conv;
  }
  return api.get<Conversation>(`/api/v1/inbox/${id}`);
}

export async function startConversation(body: StartConversationBody): Promise<Conversation> {
  if (USE_MOCK) {
    initMock();
    const newId = Date.now();
    const other: ConversationParticipant = { id: body.participant_id, username: `user_${body.participant_id}`, profile_picture: null };
    const conv: Conversation = {
      id: newId,
      participants: [getMockSelf(), other],
      listing: body.listing_id ? { id: body.listing_id, title: `Listing #${body.listing_id}`, primary_image: null } : null,
      last_message: null,
      messages: [],
      unread_count: 0,
      updated_at: new Date().toISOString(),
    };
    _mockConversations.unshift(conv);
    return conv;
  }
  return api.post<Conversation>("/api/v1/inbox", body);
}

export async function sendMessage(conversationId: number, content: string): Promise<Message> {
  if (USE_MOCK) {
    initMock();
    const conv = _mockConversations.find((c) => c.id === conversationId);
    const msg: Message = {
      id: Date.now(),
      sender: getMockSelf(),
      content,
      is_read: true,
      created_at: new Date().toISOString(),
    };
    if (conv) {
      conv.messages = [...(conv.messages ?? []), msg];
      conv.last_message = msg;
      conv.updated_at = msg.created_at;
    }
    return msg;
  }
  return api.post<Message>(`/api/v1/inbox/${conversationId}/messages`, { content });
}

export async function markMessageRead(messageId: number): Promise<void> {
  if (USE_MOCK) {
    for (const conv of _mockConversations) {
      const msg = conv.messages?.find((m) => m.id === messageId);
      if (msg) { msg.is_read = true; conv.unread_count = Math.max(0, conv.unread_count - 1); }
    }
    return;
  }
  await api.post<{ message: string }>(`/api/v1/inbox/messages/${messageId}/mark-read`, {});
}

export async function getUnreadCount(): Promise<number> {
  if (USE_MOCK) {
    initMock();
    return _mockConversations.reduce((sum, c) => sum + c.unread_count, 0);
  }
  const data = await api.get<{ unread_count: number }>("/api/v1/inbox/unread-count/");
  return data.unread_count;
}
