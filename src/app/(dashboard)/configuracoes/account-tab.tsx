"use client";

import { useActionState } from "react";
import { Mail, User as UserIcon, Lock, Save } from "lucide-react";
import {
  updateProfileAction,
  updatePasswordAction,
  type ProfileState,
  type PasswordState,
} from "./actions";
import {
  Section,
  INPUT_CLS,
  LABEL_CLS,
  BTN_PRIMARY,
  ERROR_BOX,
  SUCCESS_BOX,
} from "./_ui";
import { avatarColor, avatarInitial } from "@/lib/avatar-color";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export function AccountTab({ user }: { user: User }) {
  return (
    <div className="space-y-3">
      <ProfileForm user={user} />
      <PasswordForm />
    </div>
  );
}

function ProfileForm({ user }: { user: User }) {
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(
    updateProfileAction,
    null
  );

  const color = avatarColor(user.name);

  return (
    <Section title="Perfil" description="Como você aparece para a equipe.">
      <form action={formAction} className="space-y-4">
        <div className="flex items-center gap-4 pb-4 border-b border-stone-100 dark:border-stone-800/60">
          <div
            className={`h-14 w-14 rounded-full ring-1 text-lg font-semibold flex items-center justify-center ${color.bg} ${color.text} ${color.ring}`}
          >
            {avatarInitial(user.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold tracking-tight truncate text-stone-900 dark:text-stone-50">
              {user.name}
            </p>
            <p className="text-[12px] text-stone-500 truncate flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {user.email}
            </p>
            <span className="mt-1.5 inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400 ring-1 ring-brand-200/60 dark:ring-brand-500/20">
              {user.role}
            </span>
          </div>
        </div>

        <div>
          <label htmlFor="name" className={`${LABEL_CLS} flex items-center gap-1.5`}>
            <UserIcon className="h-3 w-3" /> Nome
          </label>
          <input
            id="name"
            name="name"
            required
            minLength={2}
            maxLength={80}
            defaultValue={user.name}
            className={INPUT_CLS}
          />
        </div>

        {state?.ok && <p className={SUCCESS_BOX}>Perfil salvo.</p>}
        {state?.error && <p className={ERROR_BOX}>{state.error}</p>}

        <div className="flex justify-end">
          <button type="submit" disabled={pending} className={BTN_PRIMARY}>
            <Save className="h-3.5 w-3.5" />
            {pending ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </form>
    </Section>
  );
}

function PasswordForm() {
  const [state, formAction, pending] = useActionState<PasswordState, FormData>(
    updatePasswordAction,
    null
  );

  return (
    <Section title="Trocar senha" description="Recomendamos atualizar periodicamente.">
      <form action={formAction} className="space-y-4" key={state?.ok ? "ok" : "form"}>
        <div>
          <label
            htmlFor="currentPassword"
            className={`${LABEL_CLS} flex items-center gap-1.5`}
          >
            <Lock className="h-3 w-3" /> Senha atual
          </label>
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            required
            autoComplete="current-password"
            className={INPUT_CLS}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="newPassword" className={LABEL_CLS}>
              Nova senha
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className={INPUT_CLS}
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className={LABEL_CLS}>
              Confirmar
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className={INPUT_CLS}
            />
          </div>
        </div>
        <p className="text-[11.5px] text-stone-500">Mínimo 8 caracteres.</p>

        {state?.ok && <p className={SUCCESS_BOX}>Senha atualizada.</p>}
        {state?.error && <p className={ERROR_BOX}>{state.error}</p>}

        <div className="flex justify-end">
          <button type="submit" disabled={pending} className={BTN_PRIMARY}>
            <Save className="h-3.5 w-3.5" />
            {pending ? "Salvando…" : "Trocar senha"}
          </button>
        </div>
      </form>
    </Section>
  );
}
