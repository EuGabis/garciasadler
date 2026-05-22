"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Settings as SettingsIcon,
} from "lucide-react";
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

const INPUT =
  "w-full rounded-md border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-1.5 text-[13px] text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition";

export function ColumnManager({ columns }: { columns: Column[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-[13px] font-medium text-stone-700 dark:text-stone-300 transition-colors"
      >
        <SettingsIcon className="h-3.5 w-3.5" />
        Gerenciar colunas
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-stone-900/40 dark:bg-black/60 backdrop-blur-[2px]"
          onClick={() => setOpen(false)}
        >
          <div
            className="absolute right-0 top-0 h-full w-[420px] max-w-full bg-white dark:bg-stone-900 shadow-2xl flex flex-col border-l border-stone-200 dark:border-stone-800"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between px-5 py-4 border-b border-stone-200/80 dark:border-stone-800/80">
              <div>
                <h2 className="text-[15px] font-semibold tracking-tight text-stone-900 dark:text-stone-50">
                  Colunas do pipeline
                </h2>
                <p className="text-[12px] text-stone-500 mt-0.5">
                  {columns.length} {columns.length === 1 ? "coluna" : "colunas"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-md text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-100 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <CreateColumnForm />
              <div className="border-t border-stone-200/80 dark:border-stone-800/80 pt-4 space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-500 mb-2 px-1">
                  Existentes
                </p>
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
    <form
      action={formAction}
      className="space-y-3 p-4 rounded-lg border border-stone-200/80 dark:border-stone-800/80 bg-stone-50 dark:bg-stone-800/30"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-500">
        Nova coluna
      </p>
      <div className="flex gap-2 items-center">
        <input
          type="color"
          name="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-9 w-11 rounded-md cursor-pointer border border-stone-200 dark:border-stone-700"
        />
        <input name="name" required maxLength={40} placeholder="Nome" className={INPUT} />
      </div>
      <div className="flex gap-2 items-center">
        <input
          name="wipLimit"
          type="number"
          min={0}
          max={999}
          placeholder="Limite WIP (opcional)"
          className={INPUT}
        />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-1 h-9 px-3.5 rounded-md bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-[12.5px] font-medium shadow-sm transition-colors"
        >
          <Plus className="h-3 w-3" />
          Criar
        </button>
      </div>
      {state?.error && (
        <p className="text-[12px] text-red-600 dark:text-red-400 px-3 py-2 rounded-md bg-red-50 dark:bg-red-500/10 ring-1 ring-red-200/60 dark:ring-red-500/20">
          {state.error}
        </p>
      )}
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
        className="p-3 rounded-lg border border-brand-300 dark:border-brand-600 bg-brand-50/50 dark:bg-brand-500/5 space-y-2"
      >
        <input type="hidden" name="id" value={column.id} />
        <div className="flex gap-2 items-center">
          <input
            type="color"
            name="color"
            defaultValue={column.color}
            className="h-9 w-11 rounded-md cursor-pointer border border-stone-200 dark:border-stone-700"
          />
          <input
            name="name"
            defaultValue={column.name}
            required
            maxLength={40}
            className={INPUT}
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
            className={INPUT}
          />
          <button
            type="submit"
            disabled={pending}
            className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-500/15"
            title="Salvar"
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="p-1.5 rounded-md text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"
            title="Cancelar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {state?.error && (
          <p className="text-[12px] text-red-600 dark:text-red-400">{state.error}</p>
        )}
      </form>
    );
  }

  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800/60 transition-colors">
      <span
        className="inline-block h-3 w-3 rounded-full shrink-0"
        style={{ backgroundColor: column.color }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium truncate text-stone-900 dark:text-stone-50">
          {column.name}
        </p>
        <p className="text-[11.5px] text-stone-500 tabular-nums">
          {column.cardCount} {column.cardCount === 1 ? "card" : "cards"}
          {column.wipLimit ? ` · limite ${column.wipLimit}` : ""}
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
      <button
        type="button"
        onClick={onDelete}
        className="p-1.5 rounded-md text-stone-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition"
        title="Excluir"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
