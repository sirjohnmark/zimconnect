"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { startConversationSchema, sendMessageSchema } from "@/lib/validations/messages";
import type { ActionResult } from "@/types/auth";

// ─── startConversation ────────────────────────────────────────────────────

/**
 * Opens (or resumes) a conversation and sends the first message.
 * Called from SellerContactCard on the listing detail page.
 */
export async function startConversation(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user || authError) return { error: "You must be signed in to send a message." };

  const parsed = startConversationSchema.safeParse({
    body:       formData.get("body"),
    listing_id: formData.get("listing_id"),
    seller_id:  formData.get("seller_id"),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const { body, listing_id, seller_id } = parsed.data;

  if (user.id === seller_id) return { error: "You cannot message yourself." };

  // Upsert conversation — idempotent if already exists.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: conv, error: convError } = await (supabase as any)
    .from("conversations")
    .upsert(
      { listing_id, buyer_id: user.id, seller_id },
      { onConflict: "listing_id,buyer_id,seller_id", ignoreDuplicates: false }
    )
    .select("id")
    .maybeSingle();

  if (convError || !conv) {
    console.error("[startConversation] upsert:", convError?.message);
    return { error: "Could not start conversation. Please try again." };
  }

  // Insert the opening message.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: msgError } = await (supabase as any)
    .from("messages")
    .insert({ conversation_id: conv.id, sender_id: user.id, body });

  if (msgError) {
    console.error("[startConversation] message insert:", msgError.message);
    return { error: "Message could not be sent. Please try again." };
  }

  redirect(`/inbox/${conv.id}`);
}

// ─── sendMessage ──────────────────────────────────────────────────────────

/**
 * Sends a reply in an existing conversation.
 * Called from ReplyForm on the thread page.
 */
export async function sendMessage(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user || authError) return { error: "You must be signed in to send a message." };

  const parsed = sendMessageSchema.safeParse({
    body:            formData.get("body"),
    conversation_id: formData.get("conversation_id"),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const { body, conversation_id } = parsed.data;

  // Verify caller is a participant — RLS enforces this too, but fail fast.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: conv } = await (supabase as any)
    .from("conversations")
    .select("id")
    .eq("id", conversation_id)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .maybeSingle();

  if (!conv) return { error: "Conversation not found." };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("messages")
    .insert({ conversation_id, sender_id: user.id, body });

  if (error) {
    console.error("[sendMessage]", error.message);
    return { error: "Message could not be sent. Please try again." };
  }

  revalidatePath(`/inbox/${conversation_id}`);
  return { message: "sent" };
}

// ─── markMessagesRead ─────────────────────────────────────────────────────

/**
 * Marks all received messages in a conversation as read.
 * Called server-side at the top of the thread page.
 */
export async function markMessagesRead(conversationId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from("messages")
    .update({ is_read: true })
    .eq("conversation_id", conversationId)
    .eq("is_read", false)
    .neq("sender_id", user.id);
}
