"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Power } from "lucide-react";
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
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition shadow-brand-glow"
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

      <div className="rounded-2xl glass overflow-hidden">
        {automations.length === 0 ? (
          <div className="p-12 text-center text-sm text-stone-400">
            Sem automações ainda. Crie a primeira no botão acima.
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            {automations.map((a) => (
              <li key={a.id} className="px-5 py-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm font-medium text-white ${!a.enabled && "opacity-50"}`}>
                        {a.name}
                      </p>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/[0.06] text-stone-300 ring-1 ring-white/10">
                        {triggerLabel[a.triggerType]}
                      </span>
                      {!a.enabled && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/[0.04] text-stone-500 ring-1 ring-white/10">
                          desativada
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-stone-400 space-y-0.5">
                      {a.triggerType === "keyword" && a.keywords.length > 0 && (
                        <p>Keywords: {a.keywords.join(", ")}</p>
                      )}
                      {a.addLabelName && <p>→ adiciona etiqueta &quot;{a.addLabelName}&quot;</p>}
                      {a.assignUserId && (
                        <p>
                          → atribui pra{" "}
                          {team.find((u) => u.id === a.assignUserId)?.name ?? "usuário"}
                        </p>
                      )}
                      {a.pipelineColumnId && (
                        <p>
                          → move pra coluna{" "}
                          {columns.find((c) => c.id === a.pipelineColumnId)?.name ?? "coluna"}
                        </p>
                      )}
                      {a.replyMessage && (
                        <p className="truncate">→ responde: &quot;{a.replyMessage}&quot;</p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggle(a.id)}
                    className={`p-1.5 rounded transition ${
                      a.enabled
                        ? "text-emerald-300 hover:bg-emerald-500/15"
                        : "text-stone-400 hover:bg-white/[0.06]"
                    }`}
                    title={a.enabled ? "Desativar" : "Ativar"}
                  >
                    <Power className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(a)}
                    className="p-1.5 rounded text-stone-400 hover:bg-white/[0.06] hover:text-stone-100"
                    title="Editar"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(a.id)}
                    className="p-1.5 rounded text-red-400 hover:bg-red-500/15"
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
