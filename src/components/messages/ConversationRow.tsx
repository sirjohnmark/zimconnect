import Link from "next/link";
import type { ConversationSummary } from "@/types";

interface ConversationRowProps {
  conversation: ConversationSummary;
  currentUserId: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)   return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-ZW", { day: "2-digit", month: "short" });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function ConversationRow({ conversation: c, currentUserId }: ConversationRowProps) {
  const hasUnread = c.unread_count > 0;

  return (
    <Link
      href={`/inbox/${c.id}`}
      className={`flex items-start gap-3 px-4 py-4 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 ${
        hasUnread ? "bg-brand-50/50" : ""
      }`}
    >
      {/* Avatar */}
      <div className="shrink-0 h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold text-sm uppercase">
        {c.other_party_display_name.charAt(0)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm truncate ${hasUnread ? "font-semibold text-slate-900" : "font-medium text-slate-700"}`}>
            {c.other_party_display_name}
          </p>
          {c.last_message_at && (
            <span className="text-xs text-slate-400 shrink-0">{timeAgo(c.last_message_at)}</span>
          )}
        </div>

        {c.listing_title && (
          <p className="text-xs text-brand-600 truncate mt-0.5">{c.listing_title}</p>
        )}

        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className={`text-sm truncate ${hasUnread ? "text-slate-700" : "text-slate-400"}`}>
            {c.last_message_body ?? "No messages yet"}
          </p>
          {hasUnread && (
            <span className="shrink-0 h-5 min-w-5 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center px-1">
              {c.unread_count > 9 ? "9+" : c.unread_count}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
