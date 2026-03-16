import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getInboxConversations } from "@/lib/queries/messages";
import ConversationRow from "@/components/messages/ConversationRow";
import { MessageCircle } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Inbox — ZimConnect" };

export default async function InboxPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const conversations = await getInboxConversations(user.id);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8">
        <h1 className="text-xl font-bold text-slate-900 mb-6">Inbox</h1>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <MessageCircle className="w-10 h-10 text-slate-300 mb-3" />
              <h2 className="text-sm font-semibold text-slate-700">No messages yet</h2>
              <p className="text-sm text-slate-400 mt-1 max-w-xs">
                When you message a seller or receive a message, it will appear here.
              </p>
              <Link
                href="/search"
                className="mt-5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
              >
                Browse listings
              </Link>
            </div>
          ) : (
            conversations.map((conv) => (
              <ConversationRow
                key={conv.id}
                conversation={conv}
                currentUserId={user.id}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
