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

export function ReplyRow({ reply }: { reply: Reply }) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState<QuickReplyState, FormData>(
    updateQuickReplyAction,
    null
  );

  if (state?.ok && editing) setEditing(false);

  if (editing) {
    return (
      <form action={formAction} className="p-4 bg-zinc-50 dark:bg-zinc-800 space-y-2">
        <input type="hidden" name="id" value={reply.id} />
        <input
          name="title"
          defaultValue={reply.title}
          required
          maxLength={60}
          placeholder="Título (atalho)"
          className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <textarea
          name="content"
          defaultValue={reply.content}
          required
          maxLength={2000}
          rows={3}
          className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-medium transition"
          >
            <Check className="h-3 w-3" />
            Salvar
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 text-xs font-medium transition"
          >
            <X className="h-3 w-3" />
            Cancelar
          </button>
          {state?.error && <span className="text-xs text-red-600">{state.error}</span>}
        </div>
      </form>
    );
  }

  return (
    <div className="p-4 flex items-start gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{reply.title}</p>
        <p className="text-xs text-zinc-500 mt-1 line-clamp-2 whitespace-pre-wrap">{reply.content}</p>
      </div>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="p-1.5 rounded text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 shrink-0"
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
          className="p-1.5 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0"
          title="Excluir"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}

export function CreateReplyForm() {
  const [state, formAction, pending] = useActionState<QuickReplyState, FormData>(
    createQuickReplyAction,
    null
  );

  return (
    <form action={formAction} className="p-4 border-b border-zinc-200 dark:border-zinc-800 space-y-2">
      <input
        name="title"
        required
        maxLength={60}
        placeholder="Título (ex: bom-dia)"
        className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <textarea
        name="content"
        required
        maxLength={2000}
        rows={2}
        placeholder="Conteúdo da resposta..."
        className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
      />
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium transition"
        >
          {pending ? "..." : "Criar"}
        </button>
        {state?.error && <span className="text-xs text-red-600">{state.error}</span>}
      </div>
    </form>
  );
}
