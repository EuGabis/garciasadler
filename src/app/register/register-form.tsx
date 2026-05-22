"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction, type RegisterState } from "./actions";

const INPUT =
  "w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3.5 py-2 text-[13px] text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition";

const LABEL =
  "block text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-600 dark:text-stone-400 mb-1.5";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState<RegisterState, FormData>(
    registerAction,
    null
  );

  return (
    <main className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 p-6">
      <div className="w-full max-w-[420px]">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto h-10 w-10 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-base shadow-sm mb-5">
            G
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
            Criar workspace
          </h1>
          <p className="mt-1.5 text-[13px] text-stone-500">
            Você será o owner do novo workspace.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-stone-900 p-6 shadow-sm">
          <form action={formAction} className="space-y-4">
            <div>
              <label htmlFor="workspaceName" className={LABEL}>
                Nome do workspace
              </label>
              <input
                id="workspaceName"
                name="workspaceName"
                required
                minLength={2}
                maxLength={80}
                placeholder="Garcia Sadler"
                className={INPUT}
              />
            </div>
            <div>
              <label htmlFor="name" className={LABEL}>
                Seu nome
              </label>
              <input
                id="name"
                name="name"
                required
                minLength={2}
                autoComplete="name"
                className={INPUT}
              />
            </div>
            <div>
              <label htmlFor="email" className={LABEL}>
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="voce@empresa.com"
                className={INPUT}
              />
            </div>
            <div>
              <label htmlFor="password" className={LABEL}>
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className={INPUT}
              />
              <p className="mt-1.5 text-[11px] text-stone-500">Mínimo 8 caracteres.</p>
            </div>

            {state?.error && (
              <p className="text-[12.5px] text-red-600 dark:text-red-400 px-3 py-2 rounded-md bg-red-50 dark:bg-red-500/10 ring-1 ring-red-200/60 dark:ring-red-500/20">
                {state.error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full inline-flex items-center justify-center h-10 px-4 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-[13.5px] font-medium shadow-sm transition-colors"
            >
              {pending ? "Criando…" : "Criar workspace"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-[13px] text-stone-500">
          Já tem conta?{" "}
          <Link
            href="/login"
            className="font-semibold text-brand-600 hover:text-brand-700 transition-colors"
          >
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}
