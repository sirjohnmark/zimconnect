"use client";

import { useActionState, useState, useTransition } from "react";
import { MessageCircle } from "lucide-react";
import { startConversation } from "@/lib/actions/messages";
import type { ActionResult } from "@/types/auth";

interface StartConversationFormProps {
  listingId: string;
  sellerId: string;
  listingTitle: string;
}

export default function StartConversationForm({
  listingId,
  sellerId,
  listingTitle,
}: StartConversationFormProps) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    startConversation,
    null
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => formAction(fd));
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-brand-600 px-4 py-2.5 text-sm font-semibold text-brand-600 hover:bg-brand-50 transition-colors"
      >
        <MessageCircle className="w-4 h-4" />
        Message seller
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input type="hidden" name="listing_id" value={listingId} />
      <input type="hidden" name="seller_id"  value={sellerId} />

      <textarea
        name="body"
        rows={3}
        maxLength={2000}
        autoFocus
        placeholder={`Hi, I'm interested in "${listingTitle}". Is it still available?`}
        required
        className="w-full resize-none rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition"
      />

      {state?.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex-1 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors disabled:opacity-50"
        >
          {isPending ? "Sending…" : "Send message"}
        </button>
      </div>
    </form>
  );
}
