"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SendHorizonal } from "lucide-react";
import { sendMessage } from "@/lib/actions/messages";
import type { ActionResult } from "@/types/auth";

interface ReplyFormProps {
  conversationId: string;
}

export default function ReplyForm({ conversationId }: ReplyFormProps) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [, startTransition] = useTransition();

  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    sendMessage,
    null
  );

  // Refresh thread and clear textarea on success
  useEffect(() => {
    if (state?.message === "sent") {
      if (textareaRef.current) textareaRef.current.value = "";
      router.refresh();
    }
  }, [state, router]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => formAction(fd));
  }

  return (
    <div className="border-t border-slate-200 bg-white px-4 py-3">
      {state?.error && (
        <p className="mb-2 text-sm text-red-600">{state.error}</p>
      )}
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <input type="hidden" name="conversation_id" value={conversationId} />
        <textarea
          ref={textareaRef}
          name="body"
          rows={2}
          maxLength={2000}
          placeholder="Type a message…"
          required
          className="flex-1 resize-none rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition"
        />
        <button
          type="submit"
          disabled={isPending}
          aria-label="Send message"
          className="shrink-0 rounded-xl bg-brand-600 p-2.5 text-white hover:bg-brand-700 transition-colors disabled:opacity-50"
        >
          <SendHorizonal className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
