"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import {
  createAutomationAction,
  updateAutomationAction,
  type AutomationState,
} from "./actions";

type User = { id: string; name: string };
type Column = { id: string; name: string };

type FormValues = {
  id?: string;
  name: string;
  enabled: boolean;
  triggerType: "first_message" | "keyword";
  keywords: string[];
  assignUserId: string | null;
  pipelineColumnId: string | null;
  addLabelName: string | null;
  replyMessage: string | null;
};

export function AutomationFormModal({
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
  const action = isEdit ? updateAutomationAction : createAutomationAction;
  const [state, formAction, pending] = useActionState<AutomationState, FormData>(action, null);

  const [triggerType, setTriggerType] = useState<"first_message" | "keyword">(
    initial?.triggerType ?? "first_message"
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
          <h2 className="text-base font-semibold">{isEdit ? "Editar" : "Nova"} automação</h2>
          <button type="button" onClick={onClose} className="text-stone-500 hover:text-stone-900 dark:hover:text-stone-100">
            <X className="h-5 w-5" />
          </button>
        </header>

        <form action={formAction} className="p-5 space-y-4">
          {isEdit && <input type="hidden" name="id" value={initial.id} />}

          <div>
            <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
              Nome da automação
            </label>
            <input
              name="name"
              required
              maxLength={80}
              defaultValue={initial?.name ?? ""}
              placeholder="ex: Saudação inicial"
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
            <span className="text-sm">Ativa</span>
          </label>

          <div>
            <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
              Gatilho
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "first_message", label: "Primeira mensagem" },
                { value: "keyword", label: "Palavra-chave" },
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
                    onChange={() => setTriggerType(t.value as "first_message" | "keyword")}
                    className="sr-only"
                  />
                  {t.label}
                </label>
              ))}
            </div>
          </div>

          {triggerType === "keyword" && (
            <div>
              <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                Palavras-chave (separadas por vírgula)
              </label>
              <input
                name="keywords"
                defaultValue={initial?.keywords?.join(", ") ?? ""}
                placeholder="ex: preço, cotação, orçamento"
                className="w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <p className="mt-1 text-[10px] text-stone-500">Match case-insensitive, sem acento.</p>
            </div>
          )}

          <div className="border-t border-stone-200 dark:border-stone-800 pt-4">
            <p className="text-xs font-semibold text-stone-600 dark:text-stone-400 mb-3">Ações</p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-stone-500 mb-1">Atribuir agente</label>
                <select
                  name="assignUserId"
                  defaultValue={initial?.assignUserId ?? ""}
                  className="w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-sm"
                >
                  <option value="">— Não atribuir —</option>
                  {team.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-stone-500 mb-1">Mover pra coluna do pipeline</label>
                <select
                  name="pipelineColumnId"
                  defaultValue={initial?.pipelineColumnId ?? ""}
                  className="w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-sm"
                >
                  <option value="">— Não mover —</option>
                  {columns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-stone-500 mb-1">Adicionar etiqueta (cria se não existir)</label>
                <input
                  name="addLabelName"
                  defaultValue={initial?.addLabelName ?? ""}
                  maxLength={40}
                  placeholder="ex: novo-lead"
                  className="w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-stone-500 mb-1">Mensagem de resposta automática</label>
                <textarea
                  name="replyMessage"
                  defaultValue={initial?.replyMessage ?? ""}
                  rows={3}
                  maxLength={2000}
                  placeholder="ex: Olá! Recebemos sua mensagem. Em instantes um atendente te responde."
                  className="w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-sm resize-none"
                />
              </div>
            </div>
          </div>

          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={pending}
              className="px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-sm font-medium transition"
            >
              {pending ? "Salvando..." : isEdit ? "Salvar alterações" : "Criar automação"}
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
