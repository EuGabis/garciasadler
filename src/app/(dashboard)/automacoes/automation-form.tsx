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

const INPUT =
  "w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3.5 py-2 text-[13px] text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition";

const LABEL =
  "block text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-600 dark:text-stone-400 mb-1.5";

const SUBLABEL =
  "block text-[11.5px] font-medium text-stone-500 mb-1";

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
            {isEdit ? "Editar automação" : "Nova automação"}
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
              Nome da automação
            </label>
            <input
              id="name"
              name="name"
              required
              maxLength={80}
              defaultValue={initial?.name ?? ""}
              placeholder="ex: Saudação inicial"
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
              Automação ativa
            </span>
          </label>

          <div>
            <label className={LABEL}>Gatilho</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "first_message", label: "Primeira mensagem" },
                { value: "keyword", label: "Palavra-chave" },
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
              <label htmlFor="keywords" className={LABEL}>
                Palavras-chave (separadas por vírgula)
              </label>
              <input
                id="keywords"
                name="keywords"
                defaultValue={initial?.keywords?.join(", ") ?? ""}
                placeholder="ex: preço, cotação, orçamento"
                className={INPUT}
              />
              <p className="mt-1.5 text-[11px] text-stone-500">
                Match case-insensitive, sem acento.
              </p>
            </div>
          )}

          <div className="border-t border-stone-200/80 dark:border-stone-800/80 pt-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-500 mb-4">
              Ações
            </p>

            <div className="space-y-4">
              <div>
                <label htmlFor="assignUserId" className={SUBLABEL}>
                  Atribuir agente
                </label>
                <select
                  id="assignUserId"
                  name="assignUserId"
                  defaultValue={initial?.assignUserId ?? ""}
                  className={INPUT}
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
                <label htmlFor="pipelineColumnId" className={SUBLABEL}>
                  Mover para coluna do pipeline
                </label>
                <select
                  id="pipelineColumnId"
                  name="pipelineColumnId"
                  defaultValue={initial?.pipelineColumnId ?? ""}
                  className={INPUT}
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
                <label htmlFor="addLabelName" className={SUBLABEL}>
                  Adicionar etiqueta{" "}
                  <span className="text-stone-400 font-normal">(cria se não existir)</span>
                </label>
                <input
                  id="addLabelName"
                  name="addLabelName"
                  defaultValue={initial?.addLabelName ?? ""}
                  maxLength={40}
                  placeholder="ex: novo-lead"
                  className={INPUT}
                />
              </div>

              <div>
                <label htmlFor="replyMessage" className={SUBLABEL}>
                  Mensagem de resposta automática
                </label>
                <textarea
                  id="replyMessage"
                  name="replyMessage"
                  defaultValue={initial?.replyMessage ?? ""}
                  rows={3}
                  maxLength={2000}
                  placeholder="ex: Olá! Recebemos sua mensagem. Em instantes um atendente responde."
                  className={`${INPUT} resize-none`}
                />
              </div>
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
              {pending ? "Salvando…" : isEdit ? "Salvar alterações" : "Criar automação"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
