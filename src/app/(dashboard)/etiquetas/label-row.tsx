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
        className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.04]"
      >
        <input type="hidden" name="id" value={label.id} />
        <input
          type="color"
          name="color"
          defaultValue={label.color}
          className="h-8 w-10 rounded cursor-pointer bg-transparent"
        />
        <input
          name="name"
          defaultValue={label.name}
          required
          maxLength={40}
          autoFocus
          className="flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-stone-100 focus:outline-none focus:ring-2 focus:ring-brand-500/60"
        />
        <button
          type="submit"
          disabled={pending}
          className="p-1.5 rounded text-emerald-300 hover:bg-emerald-500/15"
          title="Salvar"
        >
          <Check className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="p-1.5 rounded text-stone-400 hover:bg-white/[0.06]"
          title="Cancelar"
        >
          <X className="h-4 w-4" />
        </button>
        {state?.error && <span className="text-xs text-red-400">{state.error}</span>}
      </form>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <span
        className="inline-block h-3 w-3 rounded-full shrink-0 ring-1 ring-white/10"
        style={{ backgroundColor: label.color }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{label.name}</p>
        <p className="text-xs text-stone-400">
          {label.conversationCount} {label.conversationCount === 1 ? "conversa" : "conversas"}
        </p>
      </div>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="p-1.5 rounded text-stone-400 hover:bg-white/[0.06] hover:text-stone-100"
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
          className="p-1.5 rounded text-red-400 hover:bg-red-500/15"
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
      className="flex items-center gap-2 p-4 border-b border-white/5"
    >
      <input
        type="color"
        name="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        className="h-9 w-12 rounded cursor-pointer bg-transparent"
      />
      <input
        name="name"
        required
        maxLength={40}
        placeholder="Nova etiqueta..."
        className="flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-stone-100 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-brand-500/60"
      />
      <button
        type="submit"
        disabled={pending}
        className="px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-sm font-medium transition shadow-brand-glow"
      >
        {pending ? "..." : "Criar"}
      </button>
      {state?.error && <span className="text-xs text-red-400 ml-2">{state.error}</span>}
    </form>
  );
}
