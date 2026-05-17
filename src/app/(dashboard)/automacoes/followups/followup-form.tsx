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

const INPUT_CLS =
  "w-full rounded-lg border border-white/10 bg-white/[0.03] text-stone-100 placeholder:text-stone-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/60";
const LABEL_CLS =
  "block text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400 mb-2";

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
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto glass rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-5 py-4 border-b border-white/5 sticky top-0 bg-stone-950/60 backdrop-blur-xl">
          <h2 className="text-base font-semibold text-white">
            {isEdit ? "Editar" : "Novo"} follow-up
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <form action={formAction} className="p-5 space-y-4">
          {isEdit && <input type="hidden" name="id" value={initial.id} />}

          <div>
            <label className={LABEL_CLS}>Nome</label>
            <input
              name="name"
              required
              maxLength={80}
              defaultValue={initial?.name ?? ""}
              placeholder="ex: Reengajamento 24h"
              className={INPUT_CLS}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="enabled"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="h-4 w-4 rounded accent-brand-500"
            />
            <span className="text-sm text-stone-200">Ativo</span>
          </label>

          <div>
            <label className={LABEL_CLS}>Quando disparar</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "inactivity", label: "Inatividade" },
                { value: "column_entry", label: "Em coluna do pipeline" },
              ].map((t) => (
                <label
                  key={t.value}
                  className={`px-3 py-2 rounded-lg border cursor-pointer text-sm text-center transition ${
                    triggerType === t.value
                      ? "border-brand-500/60 bg-brand-500/15 text-brand-200"
                      : "border-white/10 bg-white/[0.03] text-stone-300 hover:bg-white/[0.06]"
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
              <label className={LABEL_CLS}>Após quantas horas sem resposta?</label>
              <input
                name="inactivityHours"
                type="number"
                min={1}
                max={720}
                required
                defaultValue={initial?.inactivityHours ?? 24}
                className={INPUT_CLS}
              />
              <p className="mt-1 text-[10px] text-stone-400">
                Só dispara se a última mensagem foi do cliente.
              </p>
            </div>
          ) : (
            <div>
              <label className={LABEL_CLS}>Coluna do pipeline</label>
              <select
                name="columnId"
                required
                defaultValue={initial?.columnId ?? ""}
                className={INPUT_CLS}
              >
                <option value="" className="bg-stone-900">
                  — Selecione —
                </option>
                {columns.map((c) => (
                  <option key={c.id} value={c.id} className="bg-stone-900">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className={LABEL_CLS}>Mensagem que será enviada</label>
            <textarea
              name="message"
              required
              maxLength={2000}
              rows={3}
              defaultValue={initial?.message ?? ""}
              placeholder="Olá! Notei que ainda não tive seu retorno..."
              className={`${INPUT_CLS} resize-none`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLS}>Repetir no máximo</label>
              <input
                name="maxTimes"
                type="number"
                min={1}
                max={10}
                defaultValue={initial?.maxTimes ?? 1}
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>Transferir pra agente (opcional)</label>
              <select
                name="transferToUserId"
                defaultValue={initial?.transferToUserId ?? ""}
                className={INPUT_CLS}
              >
                <option value="" className="bg-stone-900">
                  — Ninguém —
                </option>
                {team.map((u) => (
                  <option key={u.id} value={u.id} className="bg-stone-900">
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {state?.error && <p className="text-sm text-red-400">{state.error}</p>}

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={pending}
              className="px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-sm font-medium transition shadow-brand-glow"
            >
              {pending ? "Salvando..." : isEdit ? "Salvar" : "Criar"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-stone-200 text-sm font-medium transition"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
