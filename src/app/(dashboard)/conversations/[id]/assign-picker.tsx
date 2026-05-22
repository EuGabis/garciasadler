"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserCheck, X, Check } from "lucide-react";
import { assignUserAction, unassignUserAction } from "./assign-actions";

type User = { id: string; name: string };

export function AssignPicker({
  conversationId,
  assigned,
  team,
}: {
  conversationId: string;
  assigned: User[];
  team: User[];
}) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const assignedIds = new Set(assigned.map((u) => u.id));

  function toggle(userId: string) {
    const isAssigned = assignedIds.has(userId);
    startTransition(async () => {
      const r = isAssigned
        ? await unassignUserAction(conversationId, userId)
        : await assignUserAction(conversationId, userId);
      if (r.error) alert(r.error);
      router.refresh();
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-[12px] font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-50 transition-colors"
        title="Atribuir"
      >
        <UserCheck className="h-3.5 w-3.5" />
        {assigned.length > 0 ? assigned.length : <span>Atribuir</span>}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 z-20 w-60 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-lg shadow-stone-900/5 dark:shadow-black/40 py-1.5 max-h-72 overflow-y-auto">
            <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-stone-400 border-b border-stone-100 dark:border-stone-800 mb-1">
              Atribuir agente
            </div>
            {team.length === 0 ? (
              <p className="px-3 py-3 text-[12px] text-stone-500">Sem agentes.</p>
            ) : (
              team.map((u) => {
                const isAssigned = assignedIds.has(u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggle(u.id)}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[13px] hover:bg-stone-50 dark:hover:bg-stone-800/60 transition-colors"
                  >
                    <span className="h-6 w-6 shrink-0 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-[10px] font-semibold flex items-center justify-center">
                      {u.name[0]?.toUpperCase() ?? "?"}
                    </span>
                    <span className="flex-1 text-left truncate text-stone-700 dark:text-stone-300">
                      {u.name}
                    </span>
                    {isAssigned && <Check className="h-3.5 w-3.5 text-brand-600" />}
                  </button>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function AssignedBadges({
  conversationId,
  assigned,
}: {
  conversationId: string;
  assigned: User[];
}) {
  const [, startTransition] = useTransition();
  const router = useRouter();

  function detach(userId: string) {
    startTransition(async () => {
      await unassignUserAction(conversationId, userId);
      router.refresh();
    });
  }

  if (assigned.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {assigned.map((u) => (
        <button
          key={u.id}
          type="button"
          onClick={() => detach(u.id)}
          className="group inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 ring-1 ring-stone-200/60 dark:ring-stone-700/60 hover:bg-stone-200 dark:hover:bg-stone-700 transition"
          title="Clique para remover"
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-500" />
          {u.name}
          <X className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100" />
        </button>
      ))}
    </div>
  );
}
