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
    <main className="relative min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 p-6 overflow-hidden">
      {/* Fundo: planta baixa + brilho de marca */}
      <div aria-hidden className="absolute inset-0 bg-blueprint" />
      <div aria-hidden className="absolute inset-0 bg-brand-radial" />

      <div className="relative w-full max-w-[380px]">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="reveal-pop relative mx-auto h-12 w-12 rounded-2xl gradient-brand flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-brand-900/25 ring-1 ring-inset ring-white/15 glow-brand mb-5">
            G
            <span aria-hidden className="absolute inset-x-2.5 bottom-2.5 h-px bg-white/35 rounded-full" />
          </div>
          <p className="reveal rd-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-600/80 dark:text-brand-400/80 mb-2">
            Garcia Sadler · CRM
          </p>
          <h1 className="reveal rd-3 text-[26px] leading-tight font-semibold tracking-tight text-stone-900 dark:text-stone-50">
            Bem-vindo de volta
          </h1>
          <p className="reveal rd-4 mt-1.5 text-[13px] text-stone-500">
            Entre pra atender sua loja.
          </p>
        </div>

        {/* Card */}
        <div className="reveal rd-5 relative rounded-2xl border border-stone-200/80 dark:border-stone-800/80 bg-white/90 dark:bg-stone-900/90 backdrop-blur-sm p-6 shadow-xl shadow-stone-900/5 overflow-hidden">
          <span aria-hidden className="absolute inset-x-0 top-0 h-[2px] rule-brand" />
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
              className="group w-full inline-flex items-center justify-center h-10 px-4 rounded-lg gradient-brand glow-brand-sm hover:glow-brand disabled:opacity-60 disabled:cursor-not-allowed text-white text-[13.5px] font-semibold ring-1 ring-inset ring-white/10 transition-all"
            >
              {pending ? "Entrando…" : "Entrar"}
            </button>
          </form>
        </div>

        <p className="reveal rd-6 mt-6 text-center text-[13px] text-stone-500">
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
