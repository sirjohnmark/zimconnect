export interface Conversation {
  id: string;
  listing_id: string | null;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

/** Joined shape returned by getInboxConversations */
export interface ConversationSummary extends Conversation {
  listing_title: string | null;
  listing_slug: string | null;
  other_party_id: string;
  other_party_username: string;
  other_party_display_name: string;
  other_party_avatar_url: string | null;
  last_message_body: string | null;
  last_message_at: string | null;
  unread_count: number;
}

/** Joined shape returned by getConversationMessages */
export interface MessageWithSender extends Message {
  sender_username: string;
  sender_display_name: string;
  sender_avatar_url: string | null;
}
