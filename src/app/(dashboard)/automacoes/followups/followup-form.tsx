"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import {
  createFollowUpAction,
  updateFollowUpAction,
  type FollowUpState,
} from "./actions";

type User = { id: string; name: string };
type Column = { id: string; name: string };

type FormValues = {
  id?: string;
  name: string;
  enabled: boolean;
  triggerType: "inactivity" | "column_entry";
  inactivityHours: number | null;
  columnId: string | null;
  message: string;
  transferToUserId: string | null;
  maxTimes: number;
};

const INPUT =
  "w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3.5 py-2 text-[13px] text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition";

const LABEL =
  "block text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-600 dark:text-stone-400 mb-1.5";

export function FollowUpFormModal({
  initial,
  team,
  columns,
  onClose,
}: {
  initial?: FormValues;
  team: User[];
  columns: Column[];
  onClose: () => void;
}) {
  const router = useRouter();
  const isEdit = !!initial?.id;
  const [state, formAction, pending] = useActionState<FollowUpState, FormData>(
    isEdit ? updateFollowUpAction : createFollowUpAction,
    null
  );

  const [triggerType, setTriggerType] = useState<"inactivity" | "column_entry">(
    initial?.triggerType ?? "inactivity"
  );
  const [enabled, setEnabled] = useState(initial?.enabled ?? true);

  if (state?.ok) {
    setTimeout(() => {
      onClose();
      router.refresh();
    }, 50);
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-900/40 dark:bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-stone-900 rounded-xl shadow-2xl border border-stone-200 dark:border-stone-800"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-5 py-4 border-b border-stone-200/80 dark:border-stone-800/80 sticky top-0 bg-white dark:bg-stone-900 z-10">
          <h2 className="text-[15px] font-semibold tracking-tight text-stone-900 dark:text-stone-50">
            {isEdit ? "Editar follow-up" : "Novo follow-up"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-100 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <form action={formAction} className="p-5 space-y-5">
          {isEdit && <input type="hidden" name="id" value={initial.id} />}

          <div>
            <label htmlFor="name" className={LABEL}>
              Nome
            </label>
            <input
              id="name"
              name="name"
              required
              maxLength={80}
              defaultValue={initial?.name ?? ""}
              placeholder="ex: Reengajamento 24h"
              className={INPUT}
            />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              name="enabled"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-stone-300 text-brand-600 focus:ring-2 focus:ring-brand-500/40"
            />
            <span className="text-[13px] font-medium text-stone-700 dark:text-stone-300">
              Follow-up ativo
            </span>
          </label>

          <div>
            <label className={LABEL}>Quando disparar</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "inactivity", label: "Inatividade" },
                { value: "column_entry", label: "Em coluna do pipeline" },
              ].map((t) => (
                <label
                  key={t.value}
                  className={`px-3 py-2 rounded-lg border cursor-pointer text-[12.5px] font-medium text-center transition-colors ${
                    triggerType === t.value
                      ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300 ring-1 ring-brand-500/20"
                      : "border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800"
                  }`}
                >
                  <input
                    type="radio"
                    name="triggerType"
                    value={t.value}
                    checked={triggerType === t.value}
                    onChange={() => setTriggerType(t.value as "inactivity" | "column_entry")}
                    className="sr-only"
                  />
                  {t.label}
                </label>
              ))}
            </div>
          </div>

          {triggerType === "inactivity" ? (
            <div>
              <label htmlFor="inactivityHours" className={LABEL}>
                Após quantas horas sem resposta?
              </label>
              <input
                id="inactivityHours"
                name="inactivityHours"
                type="number"
                min={1}
                max={720}
                required
                defaultValue={initial?.inactivityHours ?? 24}
                className={INPUT}
              />
              <p className="mt-1.5 text-[11px] text-stone-500">
                Só dispara se a última mensagem foi do cliente.
              </p>
            </div>
          ) : (
            <div>
              <label htmlFor="columnId" className={LABEL}>
                Coluna do pipeline
              </label>
              <select
                id="columnId"
                name="columnId"
                required
                defaultValue={initial?.columnId ?? ""}
                className={INPUT}
              >
                <option value="">- Selecione -</option>
                {columns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="message" className={LABEL}>
              Mensagem que será enviada
            </label>
            <textarea
              id="message"
              name="message"
              required
              maxLength={2000}
              rows={3}
              defaultValue={initial?.message ?? ""}
              placeholder="Olá! Notei que ainda não tive seu retorno…"
              className={`${INPUT} resize-none`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="maxTimes" className={LABEL}>
                Repetir no máximo
              </label>
              <input
                id="maxTimes"
                name="maxTimes"
                type="number"
                min={1}
                max={10}
                defaultValue={initial?.maxTimes ?? 1}
                className={INPUT}
              />
            </div>
            <div>
              <label htmlFor="transferToUserId" className={LABEL}>
                Transferir para agente
              </label>
              <select
                id="transferToUserId"
                name="transferToUserId"
                defaultValue={initial?.transferToUserId ?? ""}
                className={INPUT}
              >
                <option value="">- Ninguém -</option>
                {team.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {state?.error && (
            <p className="text-[12.5px] text-red-600 dark:text-red-400 px-3 py-2 rounded-md bg-red-50 dark:bg-red-500/10 ring-1 ring-red-200/60 dark:ring-red-500/20">
              {state.error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center h-9 px-3.5 rounded-lg text-[13px] font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-[13px] font-medium shadow-sm transition-colors"
            >
              {pending ? "Salvando…" : isEdit ? "Salvar" : "Criar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
