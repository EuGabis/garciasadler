"use client";

import { useActionState, useState } from "react";
import { Pencil, Trash2, X, Check } from "lucide-react";
import {
  createLabelAction,
  updateLabelAction,
  deleteLabelAction,
  type LabelState,
} from "./actions";

type Label = {
  id: string;
  name: string;
  color: string;
  conversationCount: number;
};

const INPUT =
  "flex-1 rounded-md border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-1.5 text-[13px] text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition";

export function LabelRow({ label }: { label: Label }) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState<LabelState, FormData>(
    updateLabelAction,
    null
  );

  if (state?.ok && editing) {
    setEditing(false);
  }

  if (editing) {
    return (
      <form
        action={formAction}
        className="flex items-center gap-2 px-5 py-3 bg-stone-50 dark:bg-stone-800/60"
      >
        <input type="hidden" name="id" value={label.id} />
        <input
          type="color"
          name="color"
          defaultValue={label.color}
          className="h-8 w-10 rounded-md cursor-pointer border border-stone-200 dark:border-stone-700"
        />
        <input
          name="name"
          defaultValue={label.name}
          required
          maxLength={40}
          autoFocus
          className={INPUT}
        />
        <button
          type="submit"
          disabled={pending}
          className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-500/15 transition"
          title="Salvar"
        >
          <Check className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="p-1.5 rounded-md text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-700 transition"
          title="Cancelar"
        >
          <X className="h-4 w-4" />
        </button>
        {state?.error && (
          <span className="text-[11.5px] text-red-600 dark:text-red-400">{state.error}</span>
        )}
      </form>
    );
  }

  return (
    <div className="flex items-center gap-3 px-5 py-3 hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors">
      <span
        className="inline-block h-3 w-3 rounded-full shrink-0 ring-2 ring-white dark:ring-stone-900"
        style={{ backgroundColor: label.color }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-semibold tracking-tight text-stone-900 dark:text-stone-50">
          {label.name}
        </p>
        <p className="text-[11.5px] text-stone-500 tabular-nums">
          {label.conversationCount}{" "}
          {label.conversationCount === 1 ? "conversa" : "conversas"}
        </p>
      </div>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="p-1.5 rounded-md text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-100 transition"
        title="Editar"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <form
        action={async () => {
          await deleteLabelAction(label.id);
        }}
      >
        <button
          type="submit"
          className="p-1.5 rounded-md text-stone-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition"
          title="Excluir"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}

export function CreateLabelForm() {
  const [state, formAction, pending] = useActionState<LabelState, FormData>(
    createLabelAction,
    null
  );
  const [color, setColor] = useState("#6366f1");

  return (
    <form
      action={formAction}
      className="flex items-center gap-2 p-4 border-b border-stone-200/80 dark:border-stone-800/80 bg-stone-50/40 dark:bg-stone-800/20"
    >
      <input
        type="color"
        name="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        className="h-9 w-11 rounded-md cursor-pointer border border-stone-200 dark:border-stone-700"
      />
      <input
        name="name"
        required
        maxLength={40}
        placeholder="Nova etiqueta…"
        className={INPUT}
      />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center h-9 px-4 rounded-md bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-[13px] font-medium shadow-sm transition-colors"
      >
        {pending ? "…" : "Criar"}
      </button>
      {state?.error && (
        <span className="text-[11.5px] text-red-600 dark:text-red-400 ml-2">{state.error}</span>
      )}
    </form>
  );
}
