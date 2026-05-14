"use client";

import { useActionState, useEffect, useRef } from "react";
import { Send } from "lucide-react";
import { sendMessageAction, type SendState } from "./actions";

export function MessageForm({ conversationId }: { conversationId: string }) {
  const [state, formAction, pending] = useActionState<SendState, FormData>(
    sendMessageAction,
    null
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3"
    >
      <input type="hidden" name="conversationId" value={conversationId} />
      <div className="flex gap-2 items-end">
        <textarea
          name="text"
          required
          rows={1}
          maxLength={4000}
          placeholder="Digite sua mensagem..."
          className="flex-1 resize-none rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 h-9 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium flex items-center gap-1.5 transition"
        >
          <Send className="h-3.5 w-3.5" />
          {pending ? "..." : "Enviar"}
        </button>
      </div>
      {state?.error && (
        <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{state.error}</p>
      )}
    </form>
  );
}
