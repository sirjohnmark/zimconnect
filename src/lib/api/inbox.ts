import { api } from "./client";

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

// ─── Endpoints ────────────────────────────────────────────────────────────────

export async function getConversations(page = 1): Promise<PaginatedConversations> {
  return api.get<PaginatedConversations>("/api/v1/inbox/", { params: { page } });
}

export async function getConversation(id: number): Promise<Conversation> {
  return api.get<Conversation>(`/api/v1/inbox/${id}/`);
}

export async function startConversation(body: StartConversationBody): Promise<Conversation> {
  return api.post<Conversation>("/api/v1/inbox/", body);
}

export async function sendMessage(conversationId: number, content: string): Promise<Message> {
  return api.post<Message>(`/api/v1/inbox/${conversationId}/messages/`, { content });
}

export async function markMessageRead(messageId: number): Promise<void> {
  await api.post<{ message: string }>(`/api/v1/inbox/messages/${messageId}/mark-read/`, {});
}

export async function getUnreadCount(): Promise<number> {
  const data = await api.get<{ unread_count: number }>("/api/v1/inbox/unread-count/");
  return data.unread_count;
}
