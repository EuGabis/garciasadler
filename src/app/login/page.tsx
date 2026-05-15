"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type LoginState } from "./actions";
import { Button, Input, Label } from "@/components/ui";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(loginAction, null);

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl gradient-brand flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-brand-orange-500/30 mb-4">
            G
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Garcia Sadler</h1>
          <p className="mt-1 text-sm text-slate-500">Entre na sua conta</p>
        </div>

        <form action={formAction} className="space-y-4">
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
              minLength={6}
              autoComplete="current-password"
            />
          </div>

          {state?.error && (
            <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
          )}

          <Button type="submit" disabled={pending} size="lg" className="w-full">
            {pending ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Não tem conta?{" "}
          <Link
            href="/register"
            className="font-semibold text-brand-orange-600 hover:text-brand-orange-700"
          >
            Criar workspace
          </Link>
        </p>
      </div>
    </main>
  );
}
