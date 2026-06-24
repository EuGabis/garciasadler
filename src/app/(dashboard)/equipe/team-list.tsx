"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, X, Users, KeyRound } from "lucide-react";
import {
  createUserAction,
  updateRoleAction,
  deleteUserAction,
  resetPasswordAction,
  type TeamState,
} from "./actions";
import { avatarColor, avatarInitial } from "@/lib/avatar-color";

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

const INPUT =
  "w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3.5 py-2 text-[13px] text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition";

const LABEL =
  "block text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-600 dark:text-stone-400 mb-1.5";

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
        <p className="text-[12.5px] text-stone-500 tabular-nums">
          {members.length} {members.length === 1 ? "membro" : "membros"}
        </p>
        {canManage && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-[13px] font-medium shadow-sm transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar agente
          </button>
        )}
      </header>

      {creating && (
        <CreateModal
          onClose={() => setCreating(false)}
          canCreateOwner={currentUser.role === "owner"}
        />
      )}

      <div className="rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-stone-900 overflow-hidden">
        {members.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto h-10 w-10 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-3">
              <Users className="h-4 w-4 text-stone-400" />
            </div>
            <p className="text-[13px] font-medium text-stone-700 dark:text-stone-300">
              Sem membros ainda
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-stone-100 dark:divide-stone-800/60">
            {members.map((m) => {
              const color = avatarColor(m.name);
              return (
                <li
                  key={m.id}
                  className="px-5 py-3.5 flex items-center gap-3 hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors"
                >
                  <div className="relative h-10 w-10 shrink-0">
                    <div
                      className={`h-full w-full rounded-full ring-1 text-sm font-semibold flex items-center justify-center ${color.bg} ${color.text} ${color.ring}`}
                    >
                      {avatarInitial(m.name)}
                    </div>
                    {m.isOnline && (
                      <span
                        title="Online"
                        className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-stone-900"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-semibold tracking-tight truncate text-stone-900 dark:text-stone-50">
                      {m.name}
                      {m.id === currentUser.id && (
                        <span className="ml-1.5 text-[10.5px] font-medium text-stone-500">
                          (você)
                        </span>
                      )}
                    </p>
                    <p className="text-[12px] text-stone-500 truncate">{m.email}</p>
                    {m.assignedCount > 0 && (
                      <p className="text-[11px] text-stone-400 mt-0.5 tabular-nums">
                        {m.assignedCount} conversa(s) atribuída(s)
                      </p>
                    )}
                  </div>

                  {canManage && m.id !== currentUser.id ? (
                    <RoleSelector member={m} currentRole={currentUser.role} />
                  ) : (
                    <span className="px-2 py-0.5 rounded-md text-[10.5px] font-semibold uppercase tracking-wider bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 ring-1 ring-stone-200/60 dark:ring-stone-700/60">
                      {roleLabel[m.role]}
                    </span>
                  )}

                  {canManage && m.id !== currentUser.id && (
                    <ResetPasswordButton
                      userId={m.id}
                      userName={m.name}
                      isTargetOwner={m.role === "owner"}
                      canResetOwner={currentUser.role === "owner"}
                    />
                  )}
                  {canManage && m.id !== currentUser.id && <DeleteButton userId={m.id} />}
                </li>
              );
            })}
          </ul>
        )}
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
  const [, formAction, pending] = useActionState<TeamState, FormData>(updateRoleAction, null);
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
        className="h-7 px-2 pr-7 rounded-md text-[11px] font-medium uppercase tracking-wider bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-0 focus:outline-none focus:ring-2 focus:ring-brand-500/40 cursor-pointer"
      >
        {canChangeOwner && <option value="owner">Owner</option>}
        <option value="admin">Admin</option>
        <option value="agent">Agente</option>
      </select>
    </form>
  );
}

function ResetPasswordButton({
  userId,
  userName,
  isTargetOwner,
  canResetOwner,
}: {
  userId: string;
  userName: string;
  isTargetOwner: boolean;
  canResetOwner: boolean;
}) {
  const [open, setOpen] = useState(false);
  const disabled = isTargetOwner && !canResetOwner;

  return (
    <>
      <button
        type="button"
        onClick={() => !disabled && setOpen(true)}
        disabled={disabled}
        className="shrink-0 p-1.5 rounded-md text-stone-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition"
        title={
          disabled
            ? "Só owner pode resetar senha de outro owner"
            : "Resetar senha"
        }
      >
        <KeyRound className="h-3.5 w-3.5" />
      </button>
      {open && (
        <ResetPasswordModal
          userId={userId}
          userName={userName}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function ResetPasswordModal({
  userId,
  userName,
  onClose,
}: {
  userId: string;
  userName: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<TeamState, FormData>(
    resetPasswordAction,
    null
  );

  if (state?.ok) {
    setTimeout(() => {
      onClose();
      router.refresh();
    }, 800);
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-900/40 dark:bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-stone-900 rounded-xl shadow-2xl border border-stone-200 dark:border-stone-800"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-5 py-4 border-b border-stone-200/80 dark:border-stone-800/80">
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight text-stone-900 dark:text-stone-50">
              Resetar senha
            </h2>
            <p className="text-[12px] text-stone-500 mt-0.5 truncate">{userName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-100 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <form action={formAction} className="p-5 space-y-4">
          <input type="hidden" name="userId" value={userId} />
          <div>
            <label htmlFor="newPassword" className={LABEL}>
              Nova senha
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              autoFocus
              className={INPUT}
            />
            <p className="mt-1.5 text-[11px] text-stone-500">
              Mínimo 8 caracteres. As sessões ativas do agente serão invalidadas.
            </p>
          </div>

          {state?.ok && (
            <p className="text-[12.5px] text-emerald-700 dark:text-emerald-400 px-3 py-2 rounded-md bg-emerald-50 dark:bg-emerald-500/10 ring-1 ring-emerald-200/60 dark:ring-emerald-500/20">
              Senha redefinida. Avise o agente da nova senha por canal seguro.
            </p>
          )}
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
              className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-[13px] font-medium shadow-sm transition-colors"
            >
              <KeyRound className="h-3.5 w-3.5" />
              {pending ? "Redefinindo…" : "Redefinir"}
            </button>
          </div>
        </form>
      </div>
    </div>
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
      className="shrink-0 p-1.5 rounded-md text-stone-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-40 transition"
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
    <div
      className="fixed inset-0 z-50 bg-stone-900/40 dark:bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-stone-900 rounded-xl shadow-2xl border border-stone-200 dark:border-stone-800"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-5 py-4 border-b border-stone-200/80 dark:border-stone-800/80">
          <h2 className="text-[15px] font-semibold tracking-tight text-stone-900 dark:text-stone-50">
            Adicionar agente
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-100 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <form action={formAction} className="p-5 space-y-4">
          <div>
            <label htmlFor="name" className={LABEL}>
              Nome
            </label>
            <input id="name" name="name" required minLength={2} maxLength={80} className={INPUT} />
          </div>
          <div>
            <label htmlFor="email" className={LABEL}>
              E-mail
            </label>
            <input id="email" name="email" type="email" required className={INPUT} />
          </div>
          <div>
            <label htmlFor="password" className={LABEL}>
              Senha inicial
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              className={INPUT}
            />
            <p className="mt-1.5 text-[11px] text-stone-500">
              Mínimo 8 caracteres. O agente pode trocar depois.
            </p>
          </div>
          <div>
            <label htmlFor="role" className={LABEL}>
              Papel
            </label>
            <select id="role" name="role" defaultValue="agent" className={INPUT}>
              <option value="agent">Agente</option>
              <option value="admin">Admin</option>
              {canCreateOwner && <option value="owner">Owner</option>}
            </select>
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
              {pending ? "Criando…" : "Criar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
