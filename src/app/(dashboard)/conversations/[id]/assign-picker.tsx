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
        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-stone-300 hover:bg-white/[0.06] hover:text-white transition"
        title="Atribuir"
      >
        <UserCheck className="h-3.5 w-3.5" />
        {assigned.length > 0 ? `${assigned.length}` : "Atribuir"}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 w-56 rounded-xl glass shadow-2xl py-1 max-h-72 overflow-y-auto">
            {team.length === 0 ? (
              <p className="px-3 py-3 text-xs text-stone-400">Sem agentes.</p>
            ) : (
              team.map((u) => {
                const isAssigned = assignedIds.has(u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggle(u.id)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-stone-200 hover:bg-white/[0.06] transition"
                  >
                    <span className="h-6 w-6 shrink-0 rounded-full bg-brand-500/20 text-brand-300 text-[10px] font-semibold flex items-center justify-center ring-1 ring-brand-500/30">
                      {u.name[0]?.toUpperCase() ?? "?"}
                    </span>
                    <span className="flex-1 text-left truncate">{u.name}</span>
                    {isAssigned && <span className="text-[10px] text-brand-300 font-medium">✓</span>}
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
          className="group inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-brand-500/15 text-brand-300 ring-1 ring-brand-500/20 hover:opacity-80 transition"
          title="Clique pra remover"
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-500" />
          {u.name}
          <X className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100" />
        </button>
      ))}
    </div>
  );
}
