"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Check, X, Settings as SettingsIcon } from "lucide-react";
import {
  createColumnAction,
  updateColumnAction,
  deleteColumnAction,
  type ColumnState,
} from "./actions";

type Column = {
  id: string;
  name: string;
  color: string;
  wipLimit: number | null;
  cardCount: number;
};

export function ColumnManager({ columns }: { columns: Column[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-xs text-stone-200 transition"
      >
        <SettingsIcon className="h-3.5 w-3.5" />
        Gerenciar colunas
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div
            className="absolute right-0 top-0 h-full w-96 max-w-full glass border-l border-white/10 flex flex-col animate-slide-in-right"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <h2 className="text-base font-semibold text-white">Colunas do pipeline</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-stone-400 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <CreateColumnForm />
              <div className="border-t border-white/5 pt-3 space-y-1">
                {columns.map((col) => (
                  <ColumnRow key={col.id} column={col} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CreateColumnForm() {
  const [state, formAction, pending] = useActionState<ColumnState, FormData>(
    createColumnAction,
    null
  );
  const [color, setColor] = useState("#6366f1");

  return (
    <form action={formAction} className="space-y-2 p-3 rounded-xl border border-white/10 bg-white/[0.03]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-300">Nova coluna</p>
      <div className="flex gap-2 items-center">
        <input
          type="color"
          name="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-9 w-12 rounded cursor-pointer"
        />
        <input
          name="name"
          required
          maxLength={40}
          placeholder="Nome"
          className="flex-1 rounded-lg border border-white/10 bg-white/[0.03] text-stone-100 placeholder:text-stone-500 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/60"
        />
      </div>
      <div className="flex gap-2 items-center">
        <input
          name="wipLimit"
          type="number"
          min={0}
          max={999}
          placeholder="Limite WIP (opcional)"
          className="flex-1 rounded-lg border border-white/10 bg-white/[0.03] text-stone-100 placeholder:text-stone-500 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/60"
        />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-xs font-medium transition shadow-brand-glow"
        >
          <Plus className="h-3 w-3" />
          Criar
        </button>
      </div>
      {state?.error && <p className="text-xs text-red-400">{state.error}</p>}
    </form>
  );
}

function ColumnRow({ column }: { column: Column }) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState<ColumnState, FormData>(
    updateColumnAction,
    null
  );
  const router = useRouter();

  if (state?.ok && editing) {
    setEditing(false);
    router.refresh();
  }

  async function onDelete() {
    if (column.cardCount > 0) {
      if (!confirm(`Excluir "${column.name}" e os ${column.cardCount} card(s)?`)) return;
    } else {
      if (!confirm(`Excluir "${column.name}"?`)) return;
    }
    await deleteColumnAction(column.id);
    router.refresh();
  }

  if (editing) {
    return (
      <form
        action={formAction}
        className="p-3 rounded-xl border border-brand-500/40 bg-brand-500/10 space-y-2"
      >
        <input type="hidden" name="id" value={column.id} />
        <div className="flex gap-2 items-center">
          <input
            type="color"
            name="color"
            defaultValue={column.color}
            className="h-9 w-12 rounded cursor-pointer"
          />
          <input
            name="name"
            defaultValue={column.name}
            required
            maxLength={40}
            className="flex-1 rounded-lg border border-white/10 bg-white/[0.03] text-stone-100 placeholder:text-stone-500 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/60"
          />
        </div>
        <div className="flex gap-2 items-center">
          <input
            name="wipLimit"
            type="number"
            defaultValue={column.wipLimit ?? ""}
            min={0}
            max={999}
            placeholder="Limite WIP"
            className="flex-1 rounded-lg border border-white/10 bg-white/[0.03] text-stone-100 placeholder:text-stone-500 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/60"
          />
          <button
            type="submit"
            disabled={pending}
            className="p-1.5 rounded text-emerald-300 hover:bg-emerald-500/15"
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="p-1.5 rounded text-stone-400 hover:bg-white/[0.06]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {state?.error && <p className="text-xs text-red-400">{state.error}</p>}
      </form>
    );
  }

  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.04] transition">
      <span
        className="inline-block h-3 w-3 rounded-full shrink-0 ring-1 ring-white/10"
        style={{ backgroundColor: column.color }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate text-white">{column.name}</p>
        <p className="text-xs text-stone-400">
          {column.cardCount} {column.cardCount === 1 ? "card" : "cards"}
          {column.wipLimit ? ` · limite ${column.wipLimit}` : ""}
        </p>
      </div>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="p-1.5 rounded text-stone-400 hover:bg-white/[0.06] hover:text-stone-100"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="p-1.5 rounded text-red-400 hover:bg-red-500/15"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
