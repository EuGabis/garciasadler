"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction, type RegisterState } from "./actions";

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState<RegisterState, FormData>(
    registerAction,
    null
  );

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Criar workspace
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Você será o owner do workspace
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          <div>
            <label htmlFor="workspaceName" className="block text-sm font-medium mb-1.5">
              Nome do workspace
            </label>
            <input
              id="workspaceName"
              name="workspaceName"
              type="text"
              required
              minLength={2}
              maxLength={80}
              placeholder="Garcia Sadler"
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1.5">
              Seu nome
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              minLength={2}
              autoComplete="name"
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1.5">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1.5">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="mt-1 text-xs text-zinc-500">Mínimo 8 caracteres</p>
          </div>

          {state?.error && (
            <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-2.5 text-sm transition"
          >
            {pending ? "Criando..." : "Criar workspace"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Já tem conta?{" "}
          <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-700">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}
