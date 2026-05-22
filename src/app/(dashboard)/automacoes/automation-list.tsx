"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Power, Zap } from "lucide-react";
import { AutomationFormModal } from "./automation-form";
import { toggleAutomationAction, deleteAutomationAction } from "./actions";

type Automation = {
  id: string;
  name: string;
  enabled: boolean;
  triggerType: "first_message" | "keyword";
  keywords: string[];
  assignUserId: string | null;
  pipelineColumnId: string | null;
  addLabelName: string | null;
  replyMessage: string | null;
};

type User = { id: string; name: string };
type Column = { id: string; name: string };

const triggerLabel = {
  first_message: "Primeira mensagem",
  keyword: "Palavra-chave",
} as const;

export function AutomationList({
  automations,
  team,
  columns,
}: {
  automations: Automation[];
  team: User[];
  columns: Column[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Automation | null>(null);

  function toggle(id: string) {
    startTransition(async () => {
      await toggleAutomationAction(id);
      router.refresh();
    });
  }

  function remove(id: string) {
    if (!confirm("Excluir esta automação?")) return;
    startTransition(async () => {
      await deleteAutomationAction(id);
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
          Nova automação
        </button>
      </div>

      {creating && (
        <AutomationFormModal team={team} columns={columns} onClose={() => setCreating(false)} />
      )}
      {editing && (
        <AutomationFormModal
          initial={editing}
          team={team}
          columns={columns}
          onClose={() => setEditing(null)}
        />
      )}

      <div className="rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-stone-900 overflow-hidden">
        {automations.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto h-10 w-10 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-3">
              <Zap className="h-4 w-4 text-stone-400" />
            </div>
            <p className="text-[13px] font-medium text-stone-700 dark:text-stone-300">
              Sem automações ainda
            </p>
            <p className="text-[12px] text-stone-500 mt-1">
              Crie a primeira no botão acima.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-stone-100 dark:divide-stone-800/60">
            {automations.map((a) => (
              <li key={a.id} className="px-5 py-3.5">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p
                        className={`text-[13.5px] font-semibold tracking-tight ${
                          !a.enabled
                            ? "text-stone-400 dark:text-stone-500"
                            : "text-stone-900 dark:text-stone-50"
                        }`}
                      >
                        {a.name}
                      </p>
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wider bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 ring-1 ring-stone-200/60 dark:ring-stone-700/60">
                        {triggerLabel[a.triggerType]}
                      </span>
                      {!a.enabled && (
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wider bg-stone-50 dark:bg-stone-800/50 text-stone-400 ring-1 ring-stone-200/60 dark:ring-stone-700/60">
                          desativada
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 text-[12px] text-stone-500 space-y-0.5">
                      {a.triggerType === "keyword" && a.keywords.length > 0 && (
                        <p>
                          <span className="text-stone-400">Keywords:</span> {a.keywords.join(", ")}
                        </p>
                      )}
                      {a.addLabelName && (
                        <p>
                          <span className="text-stone-400">→</span> adiciona etiqueta{" "}
                          <span className="font-medium text-stone-700 dark:text-stone-300">
                            &quot;{a.addLabelName}&quot;
                          </span>
                        </p>
                      )}
                      {a.assignUserId && (
                        <p>
                          <span className="text-stone-400">→</span> atribui para{" "}
                          <span className="font-medium text-stone-700 dark:text-stone-300">
                            {team.find((u) => u.id === a.assignUserId)?.name ?? "usuário"}
                          </span>
                        </p>
                      )}
                      {a.pipelineColumnId && (
                        <p>
                          <span className="text-stone-400">→</span> move para coluna{" "}
                          <span className="font-medium text-stone-700 dark:text-stone-300">
                            {columns.find((c) => c.id === a.pipelineColumnId)?.name ?? "coluna"}
                          </span>
                        </p>
                      )}
                      {a.replyMessage && (
                        <p className="truncate">
                          <span className="text-stone-400">→</span> responde:{" "}
                          <span className="text-stone-600 dark:text-stone-400">
                            &quot;{a.replyMessage}&quot;
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggle(a.id)}
                    className={`p-1.5 rounded-md transition ${
                      a.enabled
                        ? "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/15"
                        : "text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-700 dark:hover:text-stone-200"
                    }`}
                    title={a.enabled ? "Desativar" : "Ativar"}
                  >
                    <Power className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(a)}
                    className="p-1.5 rounded-md text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-100 transition"
                    title="Editar"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(a.id)}
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
