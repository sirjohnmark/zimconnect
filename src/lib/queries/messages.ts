import { createClient } from "@/lib/supabase/server";
import type { Conversation, ConversationSummary, MessageWithSender } from "@/types";

// ─── Inbox ────────────────────────────────────────────────────────────────

/**
 * All conversations for a user (as buyer or seller), newest first.
 * Computes last message preview and unread count per conversation.
 */
export async function getInboxConversations(
  userId: string
): Promise<ConversationSummary[]> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("conversations")
    .select(`
      id, listing_id, buyer_id, seller_id, created_at, updated_at,
      listing:listings!listing_id ( title, slug ),
      buyer:profiles!buyer_id ( id, username, display_name, avatar_url ),
      seller:profiles!seller_id ( id, username, display_name, avatar_url ),
      messages ( body, created_at, is_read, sender_id )
    `)
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[getInboxConversations]", error.message);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any): ConversationSummary => {
    const isbuyer = row.buyer_id === userId;
    const other   = isbuyer ? row.seller : row.buyer;
    const msgs: { body: string; created_at: string; is_read: boolean; sender_id: string }[] =
      row.messages ?? [];

    const sorted = [...msgs].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const last         = sorted[0] ?? null;
    const unread_count = msgs.filter((m) => !m.is_read && m.sender_id !== userId).length;

    return {
      id:                      row.id,
      listing_id:              row.listing_id,
      buyer_id:                row.buyer_id,
      seller_id:               row.seller_id,
      created_at:              row.created_at,
      updated_at:              row.updated_at,
      listing_title:           row.listing?.title  ?? null,
      listing_slug:            row.listing?.slug   ?? null,
      other_party_id:          other?.id           ?? "",
      other_party_username:    other?.username     ?? "unknown",
      other_party_display_name: other?.display_name ?? "Unknown",
      other_party_avatar_url:  other?.avatar_url   ?? null,
      last_message_body:       last?.body          ?? null,
      last_message_at:         last?.created_at    ?? null,
      unread_count,
    };
  });
}

// ─── Conversation detail ──────────────────────────────────────────────────

/**
 * Single conversation — returns null if caller is not a participant.
 */
export async function getConversationById(
  conversationId: string,
  userId: string
): Promise<Conversation | null> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .maybeSingle();

  if (error) {
    console.error("[getConversationById]", error.message);
    return null;
  }

  return data as Conversation | null;
}

/**
 * All messages in a thread, oldest first, with sender profile.
 */
export async function getConversationMessages(
  conversationId: string
): Promise<MessageWithSender[]> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("messages")
    .select(`
      id, conversation_id, sender_id, body, is_read, created_at,
      sender:profiles!sender_id ( username, display_name, avatar_url )
    `)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) {
    console.error("[getConversationMessages]", error.message);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any): MessageWithSender => ({
    id:                   row.id,
    conversation_id:      row.conversation_id,
    sender_id:            row.sender_id,
    body:                 row.body,
    is_read:              row.is_read,
    created_at:           row.created_at,
    sender_username:      row.sender?.username     ?? "unknown",
    sender_display_name:  row.sender?.display_name ?? "Unknown",
    sender_avatar_url:    row.sender?.avatar_url   ?? null,
  }));
}

// ─── Navbar badge ─────────────────────────────────────────────────────────

/**
 * Count of unread messages sent to the user by others.
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count, error } = await (supabase as any)
    .from("messages")
    .select(
      `id, conversation:conversations!conversation_id ( buyer_id, seller_id )`,
      { count: "exact", head: true }
    )
    .eq("is_read", false)
    .neq("sender_id", userId);

  if (error) {
    console.error("[getUnreadCount]", error.message);
    return 0;
  }

  return count ?? 0;
}
