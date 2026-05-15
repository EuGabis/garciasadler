"use client";

import { useActionState } from "react";
import { Mail, User as UserIcon, Lock, Save } from "lucide-react";
import { Button, Input, Label, SectionCard } from "@/components/ui";
import {
  updateProfileAction,
  updatePasswordAction,
  type ProfileState,
  type PasswordState,
} from "./actions";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export function AccountTab({ user }: { user: User }) {
  return (
    <div className="space-y-6">
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

  return (
    <SectionCard title="Perfil" description="Como você aparece pra equipe.">
      <form action={formAction} className="space-y-4">
        <div className="flex items-center gap-4 pb-4 border-b border-stone-100 dark:border-stone-800">
          <div className="h-14 w-14 rounded-full bg-brand-500 text-white text-lg font-bold flex items-center justify-center shadow-md shadow-brand-500/30">
            {user.name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate">{user.name}</p>
            <p className="text-xs text-stone-500 truncate flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {user.email}
            </p>
            <span className="mt-1 inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-brand-500/10 text-brand-600">
              {user.role}
            </span>
          </div>
        </div>

        <div>
          <Label htmlFor="name" className="flex items-center gap-1.5">
            <UserIcon className="h-3 w-3" /> Nome
          </Label>
          <Input
            id="name"
            name="name"
            required
            minLength={2}
            maxLength={80}
            defaultValue={user.name}
          />
        </div>

        {state?.ok && <p className="text-sm text-emerald-600">Salvo.</p>}
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

        <Button type="submit" disabled={pending}>
          <Save className="h-3.5 w-3.5" />
          {pending ? "Salvando..." : "Salvar"}
        </Button>
      </form>
    </SectionCard>
  );
}

function PasswordForm() {
  const [state, formAction, pending] = useActionState<PasswordState, FormData>(
    updatePasswordAction,
    null
  );

  return (
    <SectionCard
      title="Trocar senha"
      description="Recomendamos atualizar periodicamente."
    >
      <form action={formAction} className="space-y-4" key={state?.ok ? "ok" : "form"}>
        <div>
          <Label htmlFor="currentPassword" className="flex items-center gap-1.5">
            <Lock className="h-3 w-3" /> Senha atual
          </Label>
          <Input
            id="currentPassword"
            name="currentPassword"
            type="password"
            required
            autoComplete="current-password"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="newPassword">Nova senha</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirmar</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
        </div>
        <p className="text-[11px] text-stone-500">Mínimo 8 caracteres.</p>

        {state?.ok && <p className="text-sm text-emerald-600">Senha atualizada.</p>}
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

        <Button type="submit" disabled={pending}>
          <Save className="h-3.5 w-3.5" />
          {pending ? "Salvando..." : "Trocar senha"}
        </Button>
      </form>
    </SectionCard>
  );
}
