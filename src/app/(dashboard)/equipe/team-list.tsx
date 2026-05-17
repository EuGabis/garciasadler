"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, X } from "lucide-react";
import {
  createUserAction,
  updateRoleAction,
  deleteUserAction,
  type TeamState,
} from "./actions";

type Member = {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "agent";
  isOnline: boolean;
  lastLoginAt: Date | null;
  assignedCount: number;
};

type CurrentUser = {
  id: string;
  role: "owner" | "admin" | "agent";
};

const roleLabel = { owner: "Owner", admin: "Admin", agent: "Agente" } as const;

export function TeamList({
  members,
  currentUser,
  canManage,
}: {
  members: Member[];
  currentUser: CurrentUser;
  canManage: boolean;
}) {
  const [creating, setCreating] = useState(false);

  return (
    <div>
      <header className="flex items-center justify-between mb-4">
        <p className="text-sm text-stone-500">
          {members.length} {members.length === 1 ? "membro" : "membros"}
        </p>
        {canManage && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition"
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar agente
          </button>
        )}
      </header>

      {creating && (
        <CreateModal onClose={() => setCreating(false)} canCreateOwner={currentUser.role === "owner"} />
      )}

      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden">
        <ul className="divide-y divide-stone-100 dark:divide-stone-800">
          {members.map((m) => (
            <li key={m.id} className="px-5 py-3 flex items-center gap-3">
              <div className="relative h-10 w-10 shrink-0">
                <div className="h-full w-full rounded-full bg-brand-500/10 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 text-sm font-semibold flex items-center justify-center">
                  {m.name[0]?.toUpperCase() ?? "?"}
                </div>
                {m.isOnline && (
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-stone-900" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {m.name}
                  {m.id === currentUser.id && (
                    <span className="ml-1.5 text-[10px] text-stone-500">(você)</span>
                  )}
                </p>
                <p className="text-xs text-stone-500 truncate">{m.email}</p>
                {m.assignedCount > 0 && (
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    {m.assignedCount} conversa(s) atribuída(s)
                  </p>
                )}
              </div>

              {canManage && m.id !== currentUser.id ? (
                <RoleSelector member={m} currentRole={currentUser.role} />
              ) : (
                <span className="px-2 py-1 rounded-md text-xs bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                  {roleLabel[m.role]}
                </span>
              )}

              {canManage && m.id !== currentUser.id && (
                <DeleteButton userId={m.id} />
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function RoleSelector({
  member,
  currentRole,
}: {
  member: Member;
  currentRole: "owner" | "admin" | "agent";
}) {
  const router = useRouter();
  const [, formAction, pending] = useActionState<TeamState, FormData>(
    updateRoleAction,
    null
  );
  const isOwner = currentRole === "owner";
  const canChangeOwner = isOwner;

  return (
    <form
      action={(fd) => {
        formAction(fd);
        setTimeout(() => router.refresh(), 100);
      }}
      className="shrink-0"
    >
      <input type="hidden" name="userId" value={member.id} />
      <select
        name="role"
        defaultValue={member.role}
        disabled={pending}
        onChange={(e) => e.target.form?.requestSubmit()}
        className="px-2 py-1 rounded-md text-xs bg-stone-100 dark:bg-stone-800 border-0 focus:outline-none focus:ring-1 focus:ring-brand-500"
      >
        {canChangeOwner && <option value="owner">Owner</option>}
        <option value="admin">Admin</option>
        <option value="agent">Agente</option>
      </select>
    </form>
  );
}

function DeleteButton({ userId }: { userId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      onClick={() => {
        if (!confirm("Excluir este usuário?")) return;
        start(async () => {
          const r = await deleteUserAction(userId);
          if (r?.error) alert(r.error);
          router.refresh();
        });
      }}
      disabled={pending}
      className="shrink-0 p-1.5 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40"
      title="Excluir"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}

function CreateModal({
  onClose,
  canCreateOwner,
}: {
  onClose: () => void;
  canCreateOwner: boolean;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<TeamState, FormData>(
    createUserAction,
    null
  );

  if (state?.ok) {
    setTimeout(() => {
      onClose();
      router.refresh();
    }, 50);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white dark:bg-stone-900 rounded-xl shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-5 py-4 border-b border-stone-200 dark:border-stone-800">
          <h2 className="text-base font-semibold">Adicionar agente</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-500 hover:text-stone-900 dark:hover:text-stone-100"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <form action={formAction} className="p-5 space-y-3">
          <div>
            <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
              Nome
            </label>
            <input
              name="name"
              required
              minLength={2}
              maxLength={80}
              className="w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
              Senha inicial
            </label>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              className="w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <p className="mt-1 text-[10px] text-stone-500">
              Mínimo 8 caracteres. O agente pode trocar depois.
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
              Papel
            </label>
            <select
              name="role"
              defaultValue="agent"
              className="w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="agent">Agente</option>
              <option value="admin">Admin</option>
              {canCreateOwner && <option value="owner">Owner</option>}
            </select>
          </div>

          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={pending}
              className="px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-sm font-medium transition"
            >
              {pending ? "Criando..." : "Criar"}
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
