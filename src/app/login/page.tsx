"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type LoginState } from "./actions";
import { AuroraBackground } from "@/components/ui";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(loginAction, null);

  return (
    <main className="relative min-h-screen flex items-center justify-center p-6 text-stone-100">
      <AuroraBackground variant="fixed" />

      <div className="w-full max-w-sm relative">
        {/* Logo "G" com glow */}
        <div className="flex justify-center mb-10 animate-fade-in">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-brand-500 blur-3xl opacity-50" />
            <div className="relative h-14 w-14 rounded-2xl gradient-brand flex items-center justify-center text-white font-extrabold text-2xl shadow-brand-glow">
              G
            </div>
          </div>
        </div>

        <div className="text-center mb-8 animate-fade-in">
          <h1 className="font-display text-4xl text-white tracking-tighter">
            Garcia Sadler
          </h1>
          <p className="mt-2 text-sm text-stone-400">
            Entre na sua conta de atendimento
          </p>
        </div>

        <form action={formAction} className="glass rounded-2xl p-6 space-y-4 animate-fade-in">
          <div>
            <label
              htmlFor="email"
              className="block text-[10px] font-semibold uppercase tracking-[0.15em] text-stone-400 mb-2"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              autoFocus
              className="w-full bg-transparent border-0 border-b border-white/10 px-1 py-2 text-sm text-white placeholder:text-stone-500 focus:outline-none focus:border-brand-500 transition"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-[10px] font-semibold uppercase tracking-[0.15em] text-stone-400 mb-2"
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
              className="w-full bg-transparent border-0 border-b border-white/10 px-1 py-2 text-sm text-white placeholder:text-stone-500 focus:outline-none focus:border-brand-500 transition"
            />
          </div>

          {state?.error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full h-11 mt-2 rounded-xl gradient-brand text-white font-semibold text-sm shadow-brand-glow hover:opacity-95 disabled:opacity-60 transition relative overflow-hidden group"
          >
            <span className="relative z-10">{pending ? "Entrando..." : "Entrar"}</span>
            <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-stone-400 animate-fade-in">
          Não tem conta?{" "}
          <Link
            href="/register"
            className="font-semibold text-brand-400 hover:text-brand-300 transition"
          >
            Criar workspace
          </Link>
        </p>

        <p className="mt-12 text-center text-[10px] uppercase tracking-[0.2em] text-stone-600">
          Material de construção · WhatsApp · IA
        </p>
      </div>
    </main>
  );
}
