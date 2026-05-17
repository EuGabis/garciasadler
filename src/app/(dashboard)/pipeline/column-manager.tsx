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
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs text-stone-700 dark:text-stone-300 transition"
      >
        <SettingsIcon className="h-3.5 w-3.5" />
        Gerenciar colunas
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setOpen(false)}>
          <div
            className="absolute right-0 top-0 h-full w-96 max-w-full bg-white dark:bg-stone-900 shadow-xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between px-5 py-4 border-b border-stone-200 dark:border-stone-800">
              <h2 className="text-base font-semibold">Colunas do pipeline</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-stone-500 hover:text-stone-900 dark:hover:text-stone-100"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <CreateColumnForm />
              <div className="border-t border-stone-200 dark:border-stone-800 pt-3 space-y-1">
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
    <form action={formAction} className="space-y-2 p-3 rounded-lg border border-stone-200 dark:border-stone-800">
      <p className="text-xs font-semibold text-stone-500">Nova coluna</p>
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
          className="flex-1 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>
      <div className="flex gap-2 items-center">
        <input
          name="wipLimit"
          type="number"
          min={0}
          max={999}
          placeholder="Limite WIP (opcional)"
          className="flex-1 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-xs font-medium transition"
        >
          <Plus className="h-3 w-3" />
          Criar
        </button>
      </div>
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
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
        className="p-3 rounded-lg border border-brand-300 dark:border-brand-700 bg-brand-50 dark:bg-brand-500/10 space-y-2"
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
            className="flex-1 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-1.5 text-sm"
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
            className="flex-1 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-1.5 text-sm"
          />
          <button
            type="submit"
            disabled={pending}
            className="p-1.5 rounded text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="p-1.5 rounded text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
      </form>
    );
  }

  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 transition">
      <span
        className="inline-block h-3 w-3 rounded-full shrink-0"
        style={{ backgroundColor: column.color }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{column.name}</p>
        <p className="text-xs text-stone-500">
          {column.cardCount} {column.cardCount === 1 ? "card" : "cards"}
          {column.wipLimit ? ` · limite ${column.wipLimit}` : ""}
        </p>
      </div>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="p-1.5 rounded text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-700"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="p-1.5 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
