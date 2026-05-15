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
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-stone-900 rounded-xl shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-5 py-4 border-b border-stone-200 dark:border-stone-800 sticky top-0 bg-white dark:bg-stone-900">
          <h2 className="text-base font-semibold">{isEdit ? "Editar" : "Novo"} follow-up</h2>
          <button type="button" onClick={onClose} className="text-stone-500 hover:text-stone-900 dark:hover:text-stone-100">
            <X className="h-5 w-5" />
          </button>
        </header>

        <form action={formAction} className="p-5 space-y-4">
          {isEdit && <input type="hidden" name="id" value={initial.id} />}

          <div>
            <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
              Nome
            </label>
            <input
              name="name"
              required
              maxLength={80}
              defaultValue={initial?.name ?? ""}
              placeholder="ex: Reengajamento 24h"
              className="w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="enabled"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="h-4 w-4 rounded text-brand-600 focus:ring-brand-500"
            />
            <span className="text-sm">Ativo</span>
          </label>

          <div>
            <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
              Quando disparar
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "inactivity", label: "Inatividade" },
                { value: "column_entry", label: "Em coluna do pipeline" },
              ].map((t) => (
                <label
                  key={t.value}
                  className={`px-3 py-2 rounded-lg border cursor-pointer text-sm text-center ${
                    triggerType === t.value
                      ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                      : "border-stone-300 dark:border-stone-700"
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
              <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                Após quantas horas sem resposta?
              </label>
              <input
                name="inactivityHours"
                type="number"
                min={1}
                max={720}
                required
                defaultValue={initial?.inactivityHours ?? 24}
                className="w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <p className="mt-1 text-[10px] text-stone-500">
                Só dispara se a última mensagem foi do cliente.
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                Coluna do pipeline
              </label>
              <select
                name="columnId"
                required
                defaultValue={initial?.columnId ?? ""}
                className="w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-sm"
              >
                <option value="">— Selecione —</option>
                {columns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
              Mensagem que será enviada
            </label>
            <textarea
              name="message"
              required
              maxLength={2000}
              rows={3}
              defaultValue={initial?.message ?? ""}
              placeholder="Olá! Notei que ainda não tive seu retorno..."
              className="w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                Repetir no máximo
              </label>
              <input
                name="maxTimes"
                type="number"
                min={1}
                max={10}
                defaultValue={initial?.maxTimes ?? 1}
                className="w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                Transferir pra agente (opcional)
              </label>
              <select
                name="transferToUserId"
                defaultValue={initial?.transferToUserId ?? ""}
                className="w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-sm"
              >
                <option value="">— Ninguém —</option>
                {team.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={pending}
              className="px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-sm font-medium transition"
            >
              {pending ? "Salvando..." : isEdit ? "Salvar" : "Criar"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 text-sm font-medium transition"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
