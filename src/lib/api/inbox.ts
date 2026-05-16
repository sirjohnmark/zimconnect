import { api } from "./client";
import { getStoredUser } from "@/lib/auth/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ConversationParticipant {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  profile_picture: string | null;
}

export interface ConversationListing {
  id: number;
  title: string;
  status?: string;
  price?: string;
  currency?: string;
  primary_image: string | null;
}

export interface Message {
  id: number;
  sender: ConversationParticipant;
  recipient?: ConversationParticipant | null;
  content: string;
  message_type: string;
  status: string; // sent | delivered | read | failed
  delivered_at: string | null;
  read_at: string | null;
  created_at: string;
  updated_at?: string;
}

export interface Conversation {
  id: number;
  other_participant: ConversationParticipant | null;
  listing: ConversationListing | null;
  status: string;
  last_message: Message | null;
  unread_count: number;
  last_message_at: string | null;
  updated_at: string;
}

export interface PaginatedConversations {
  count: number;
  next: string | null;
  previous: string | null;
  results: Conversation[];
}

export interface PaginatedMessages {
  count: number;
  next: string | null;
  previous: string | null;
  results: Message[];
}

export interface StartConversationBody {
  listing_id: number;
  initial_message: string;
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
    message_type: "text",
    status: "sent",
    delivered_at: null,
    read_at: null,
    created_at: new Date(Date.now() - id * 3_600_000).toISOString(),
  };
  return {
    id,
    other_participant: other,
    listing: null,
    status: "active",
    last_message: msg,
    unread_count: 1,
    last_message_at: msg.created_at,
    updated_at: msg.created_at,
  };
}

function initMock() {
  if (_mockConversations.length === 0) {
    _mockConversations = [
      mockConversation(1, "buyer_alice", "Is this still available?"),
      mockConversation(2, "seller_bob", "Yes, I can deliver tomorrow."),
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
  return api.get<PaginatedConversations>("/api/v1/inbox/", { params: { page } });
}

export async function getConversation(id: number): Promise<Conversation> {
  if (USE_MOCK) {
    initMock();
    const conv = _mockConversations.find((c) => c.id === id);
    if (!conv) throw new Error("Conversation not found");
    return conv;
  }
  return api.get<Conversation>(`/api/v1/inbox/${id}/`);
}

export async function getConversationMessages(id: number, page = 1): Promise<PaginatedMessages> {
  if (USE_MOCK) {
    return { count: 0, next: null, previous: null, results: [] };
  }
  return api.get<PaginatedMessages>(`/api/v1/inbox/${id}/messages/`, { params: { page } });
}

export async function startConversation(body: StartConversationBody): Promise<Conversation> {
  if (USE_MOCK) {
    initMock();
    const conv: Conversation = {
      id: Date.now(),
      other_participant: {
        id: body.listing_id + 200,
        username: `seller_${body.listing_id}`,
        profile_picture: null,
      },
      listing: { id: body.listing_id, title: `Listing #${body.listing_id}`, primary_image: null },
      status: "active",
      last_message: null,
      unread_count: 0,
      last_message_at: null,
      updated_at: new Date().toISOString(),
    };
    _mockConversations.unshift(conv);
    return conv;
  }
  return api.post<Conversation>("/api/v1/inbox/start/", body);
}

export async function sendMessage(conversationId: number, content: string): Promise<Message> {
  if (USE_MOCK) {
    initMock();
    const conv = _mockConversations.find((c) => c.id === conversationId);
    const msg: Message = {
      id: Date.now(),
      sender: getMockSelf(),
      content,
      message_type: "text",
      status: "sent",
      delivered_at: null,
      read_at: null,
      created_at: new Date().toISOString(),
    };
    if (conv) {
      conv.last_message = msg;
      conv.last_message_at = msg.created_at;
      conv.updated_at = msg.created_at;
    }
    return msg;
  }
  return api.post<Message>(`/api/v1/inbox/${conversationId}/send/`, { content });
}

export async function markConversationRead(conversationId: number): Promise<void> {
  if (USE_MOCK) return;
  await api.post<{ message: string }>(`/api/v1/inbox/${conversationId}/read/`, {});
}

export async function markMessageRead(messageId: number): Promise<void> {
  if (USE_MOCK) return;
  await api.post<{ message: string }>(`/api/v1/inbox/messages/${messageId}/mark-read/`, {});
}

export async function getUnreadCount(): Promise<number> {
  if (USE_MOCK) {
    initMock();
    return _mockConversations.reduce((sum, c) => sum + c.unread_count, 0);
  }
  const data = await api.get<{ unread_count: number }>("/api/v1/inbox/unread-count/");
  return data.unread_count;
}
