"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Power } from "lucide-react";
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
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-orange-500 hover:bg-brand-orange-600 text-white text-sm font-medium transition"
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

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        {followUps.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">
            Sem follow-ups ainda.
            <br />
            Crie um pra reengajar conversas paradas.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {followUps.map((f) => (
              <li key={f.id} className="px-5 py-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm font-medium ${!f.enabled && "opacity-50"}`}>{f.name}</p>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {f.triggerType === "inactivity"
                          ? `${f.inactivityHours ?? "?"}h sem resposta`
                          : `Em "${columns.find((c) => c.id === f.columnId)?.name ?? "coluna"}"`}
                      </span>
                      {!f.enabled && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-200 dark:bg-slate-700 text-slate-500">
                          desativado
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-500 line-clamp-2">{f.message}</p>
                    <p className="mt-0.5 text-[10px] text-slate-500">
                      Máx {f.maxTimes}× por conversa · {f.totalExecutions} execução(ões) total
                      {f.transferToUserId &&
                        ` · transfere pra ${team.find((u) => u.id === f.transferToUserId)?.name ?? "agente"}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggle(f.id)}
                    className={`p-1.5 rounded transition ${
                      f.enabled
                        ? "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                        : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                    title={f.enabled ? "Desativar" : "Ativar"}
                  >
                    <Power className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(f)}
                    className="p-1.5 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Editar"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(f.id)}
                    className="p-1.5 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
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
