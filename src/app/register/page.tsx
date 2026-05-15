"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction, type RegisterState } from "./actions";
import { Button, Input, Label } from "@/components/ui";

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState<RegisterState, FormData>(
    registerAction,
    null
  );

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl gradient-brand flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-brand-orange-500/30 mb-4">
            G
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Criar workspace</h1>
          <p className="mt-1 text-sm text-slate-500">Você será o owner do workspace</p>
        </div>

        <form action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="workspaceName">Nome do workspace</Label>
            <Input
              id="workspaceName"
              name="workspaceName"
              required
              minLength={2}
              maxLength={80}
              placeholder="Garcia Sadler"
            />
          </div>
          <div>
            <Label htmlFor="name">Seu nome</Label>
            <Input id="name" name="name" required minLength={2} autoComplete="name" />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div>
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
            />
            <p className="mt-1 text-[11px] text-slate-500">Mínimo 8 caracteres</p>
          </div>

          {state?.error && (
            <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
          )}

          <Button type="submit" disabled={pending} size="lg" className="w-full">
            {pending ? "Criando..." : "Criar workspace"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Já tem conta?{" "}
          <Link
            href="/login"
            className="font-semibold text-brand-orange-600 hover:text-brand-orange-700"
          >
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}
