"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type LoginState } from "./actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginAction,
    null
  );

  return (
    <main className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 p-6">
      <div className="w-full max-w-[380px]">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto h-10 w-10 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-base shadow-sm mb-5">
            G
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
            Bem-vindo de volta
          </h1>
          <p className="mt-1.5 text-[13px] text-stone-500">
            Entre na sua conta Garcia Sadler.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-stone-900 p-6 shadow-sm">
          <form action={formAction} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-600 dark:text-stone-400 mb-1.5"
              >
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="voce@empresa.com"
                className="w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3.5 py-2 text-[13px] text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-600 dark:text-stone-400 mb-1.5"
              >
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                autoComplete="current-password"
                className="w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3.5 py-2 text-[13px] text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition"
              />
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
              {pending ? "Entrando…" : "Entrar"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-[13px] text-stone-500">
          Não tem conta?{" "}
          <Link
            href="/register"
            className="font-semibold text-brand-600 hover:text-brand-700 transition-colors"
          >
            Criar workspace
          </Link>
        </p>
      </div>
    </main>
  );
}
