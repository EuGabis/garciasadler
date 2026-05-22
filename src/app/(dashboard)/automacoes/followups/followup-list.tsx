"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Power, Clock } from "lucide-react";
import { FollowUpFormModal } from "./followup-form";
import { toggleFollowUpAction, deleteFollowUpAction } from "./actions";

type FollowUp = {
  id: string;
  name: string;
  enabled: boolean;
  triggerType: "inactivity" | "column_entry";
  inactivityHours: number | null;
  columnId: string | null;
  message: string;
  transferToUserId: string | null;
  maxTimes: number;
  totalExecutions: number;
};

type User = { id: string; name: string };
type Column = { id: string; name: string };

export function FollowUpList({
  followUps,
  team,
  columns,
}: {
  followUps: FollowUp[];
  team: User[];
  columns: Column[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<FollowUp | null>(null);

  function toggle(id: string) {
    startTransition(async () => {
      await toggleFollowUpAction(id);
      router.refresh();
    });
  }

  function remove(id: string) {
    if (!confirm("Excluir este follow-up? Histórico de execução também é apagado.")) return;
    startTransition(async () => {
      await deleteFollowUpAction(id);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-[13px] font-medium shadow-sm transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Novo follow-up
        </button>
      </div>

      {creating && (
        <FollowUpFormModal team={team} columns={columns} onClose={() => setCreating(false)} />
      )}
      {editing && (
        <FollowUpFormModal
          initial={editing}
          team={team}
          columns={columns}
          onClose={() => setEditing(null)}
        />
      )}

      <div className="rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-stone-900 overflow-hidden">
        {followUps.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto h-10 w-10 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-3">
              <Clock className="h-4 w-4 text-stone-400" />
            </div>
            <p className="text-[13px] font-medium text-stone-700 dark:text-stone-300">
              Sem follow-ups ainda
            </p>
            <p className="text-[12px] text-stone-500 mt-1">
              Crie um para reengajar conversas paradas.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-stone-100 dark:divide-stone-800/60">
            {followUps.map((f) => (
              <li key={f.id} className="px-5 py-3.5">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p
                        className={`text-[13.5px] font-semibold tracking-tight ${
                          !f.enabled
                            ? "text-stone-400 dark:text-stone-500"
                            : "text-stone-900 dark:text-stone-50"
                        }`}
                      >
                        {f.name}
                      </p>
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wider bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 ring-1 ring-stone-200/60 dark:ring-stone-700/60">
                        {f.triggerType === "inactivity"
                          ? `${f.inactivityHours ?? "?"}h sem resposta`
                          : `Em "${columns.find((c) => c.id === f.columnId)?.name ?? "coluna"}"`}
                      </span>
                      {!f.enabled && (
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wider bg-stone-50 dark:bg-stone-800/50 text-stone-400 ring-1 ring-stone-200/60 dark:ring-stone-700/60">
                          desativado
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-[12.5px] text-stone-600 dark:text-stone-400 line-clamp-2">
                      {f.message}
                    </p>
                    <p className="mt-1 text-[11px] text-stone-500 tabular-nums">
                      Máx {f.maxTimes}× por conversa · {f.totalExecutions} execução(ões) total
                      {f.transferToUserId &&
                        ` · transfere para ${team.find((u) => u.id === f.transferToUserId)?.name ?? "agente"}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggle(f.id)}
                    className={`p-1.5 rounded-md transition ${
                      f.enabled
                        ? "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/15"
                        : "text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-700 dark:hover:text-stone-200"
                    }`}
                    title={f.enabled ? "Desativar" : "Ativar"}
                  >
                    <Power className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(f)}
                    className="p-1.5 rounded-md text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-100 transition"
                    title="Editar"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(f.id)}
                    className="p-1.5 rounded-md text-stone-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition"
                    title="Excluir"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
