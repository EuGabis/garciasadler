"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserCheck, X } from "lucide-react";
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
        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
        title="Atribuir"
      >
        <UserCheck className="h-3.5 w-3.5" />
        {assigned.length > 0 ? `${assigned.length}` : "Atribuir"}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 w-56 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg py-1 max-h-72 overflow-y-auto">
            {team.length === 0 ? (
              <p className="px-3 py-3 text-xs text-zinc-500">Sem agentes.</p>
            ) : (
              team.map((u) => {
                const isAssigned = assignedIds.has(u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggle(u.id)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
                  >
                    <span className="h-6 w-6 shrink-0 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-[10px] font-semibold flex items-center justify-center">
                      {u.name[0]?.toUpperCase() ?? "?"}
                    </span>
                    <span className="flex-1 text-left truncate">{u.name}</span>
                    {isAssigned && <span className="text-[10px] text-indigo-600 font-medium">✓</span>}
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
          className="group inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:opacity-70 transition"
          title="Clique pra remover"
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-indigo-500" />
          {u.name}
          <X className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100" />
        </button>
      ))}
    </div>
  );
}
