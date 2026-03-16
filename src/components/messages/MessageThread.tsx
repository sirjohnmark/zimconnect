import type { MessageWithSender } from "@/types";

interface MessageThreadProps {
  messages: MessageWithSender[];
  currentUserId: string;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-ZW", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MessageThread({ messages, currentUserId }: MessageThreadProps) {
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center py-16 text-sm text-slate-400">
        No messages yet. Start the conversation below.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      {messages.map((msg) => {
        const isOwn = msg.sender_id === currentUserId;
        return (
          <div key={msg.id} className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
            {/* Avatar */}
            {!isOwn && (
              <div className="shrink-0 h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600 uppercase">
                {msg.sender_display_name.charAt(0)}
              </div>
            )}

            {/* Bubble */}
            <div className={`max-w-xs sm:max-w-md ${isOwn ? "items-end" : "items-start"} flex flex-col gap-1`}>
              <div
                className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                  isOwn
                    ? "bg-brand-600 text-white rounded-br-sm"
                    : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm"
                }`}
              >
                {msg.body}
              </div>
              <span className="text-[11px] text-slate-400 px-1">{formatTime(msg.created_at)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
