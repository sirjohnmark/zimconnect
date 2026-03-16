import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getConversationById, getConversationMessages } from "@/lib/queries/messages";
import { markMessagesRead } from "@/lib/actions/messages";
import MessageThread from "@/components/messages/MessageThread";
import ReplyForm from "@/components/messages/ReplyForm";
import { ChevronLeft } from "lucide-react";
import type { PageProps } from "@/types";

export const metadata: Metadata = { title: "Conversation — ZimConnect" };

export default async function ConversationPage({ params }: PageProps<{ conversationId: string }>) {
  const { conversationId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const conversation = await getConversationById(conversationId, user.id);
  if (!conversation) notFound();

  // Mark received messages as read before fetching thread
  await markMessagesRead(conversationId);
  const messages = await getConversationMessages(conversationId);

  // Resolve other party display name for header
  const otherPartyId = conversation.buyer_id === user.id ? conversation.seller_id : conversation.buyer_id;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: otherProfile } = await (supabase as any)
    .from("profiles")
    .select("display_name, username")
    .eq("id", otherPartyId)
    .maybeSingle();

  const otherName = otherProfile?.display_name ?? otherProfile?.username ?? "Unknown";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
        <Link
          href="/inbox"
          className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition-colors"
          aria-label="Back to inbox"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <p className="text-sm font-semibold text-slate-800">{otherName}</p>
          {conversation.listing_id && (
            <p className="text-xs text-slate-400">re: listing</p>
          )}
        </div>
      </div>

      {/* Thread */}
      <div className="flex-1 mx-auto w-full max-w-2xl flex flex-col">
        <MessageThread messages={messages} currentUserId={user.id} />
        <ReplyForm conversationId={conversationId} />
      </div>
    </div>
  );
}
