"use client";

import { useActionState, useState } from "react";
import { Pencil, Trash2, X, Check } from "lucide-react";
import {
  createQuickReplyAction,
  updateQuickReplyAction,
  deleteQuickReplyAction,
  type QuickReplyState,
} from "./actions";

type Reply = { id: string; title: string; content: string };

const INPUT =
  "w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3.5 py-2 text-[13px] text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition";

export function ReplyRow({ reply }: { reply: Reply }) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState<QuickReplyState, FormData>(
    updateQuickReplyAction,
    null
  );

  if (state?.ok && editing) setEditing(false);

  if (editing) {
    return (
      <form
        action={formAction}
        className="p-4 bg-stone-50 dark:bg-stone-800/40 space-y-2.5"
      >
        <input type="hidden" name="id" value={reply.id} />
        <input
          name="title"
          defaultValue={reply.title}
          required
          maxLength={60}
          placeholder="Título (atalho)"
          className={INPUT}
        />
        <textarea
          name="content"
          defaultValue={reply.content}
          required
          maxLength={2000}
          rows={3}
          className={`${INPUT} resize-none`}
        />
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-1 h-8 px-3 rounded-md bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-[12px] font-medium shadow-sm transition-colors"
          >
            <Check className="h-3 w-3" />
            Salvar
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="inline-flex items-center gap-1 h-8 px-3 rounded-md border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 text-[12px] font-medium text-stone-700 dark:text-stone-300 transition-colors"
          >
            <X className="h-3 w-3" />
            Cancelar
          </button>
          {state?.error && (
            <span className="text-[11.5px] text-red-600 dark:text-red-400">{state.error}</span>
          )}
        </div>
      </form>
    );
  }

  return (
    <div className="px-5 py-3.5 flex items-start gap-3 hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-semibold tracking-tight text-stone-900 dark:text-stone-50">
          {reply.title}
        </p>
        <p className="text-[12px] text-stone-500 mt-1 line-clamp-2 whitespace-pre-wrap">
          {reply.content}
        </p>
      </div>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="p-1.5 rounded-md text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-100 shrink-0 transition"
        title="Editar"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <form
        action={async () => {
          await deleteQuickReplyAction(reply.id);
        }}
      >
        <button
          type="submit"
          className="p-1.5 rounded-md text-stone-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 shrink-0 transition"
          title="Excluir"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}

export function CreateQuickReplyForm() {
  return null; // Placeholder pra compat
}

export function CreateReplyForm() {
  const [state, formAction, pending] = useActionState<QuickReplyState, FormData>(
    createQuickReplyAction,
    null
  );

  return (
    <form
      action={formAction}
      className="p-4 border-b border-stone-200/80 dark:border-stone-800/80 bg-stone-50/40 dark:bg-stone-800/20 space-y-2.5"
    >
      <input
        name="title"
        required
        maxLength={60}
        placeholder="Título (ex: bom-dia)"
        className={INPUT}
      />
      <textarea
        name="content"
        required
        maxLength={2000}
        rows={2}
        placeholder="Conteúdo da resposta…"
        className={`${INPUT} resize-none`}
      />
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-[13px] font-medium shadow-sm transition-colors"
        >
          {pending ? "…" : "Criar"}
        </button>
        {state?.error && (
          <span className="text-[11.5px] text-red-600 dark:text-red-400 ml-2">{state.error}</span>
        )}
      </div>
    </form>
  );
}
