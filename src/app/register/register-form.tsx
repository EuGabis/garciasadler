"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction, type RegisterState } from "./actions";
import { AuroraBackground } from "@/components/ui";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState<RegisterState, FormData>(
    registerAction,
    null
  );

  return (
    <main className="relative min-h-screen flex items-center justify-center p-6 text-stone-100">
      <AuroraBackground variant="fixed" />

      <div className="w-full max-w-sm relative">
        <div className="flex justify-center mb-10 animate-fade-in">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-brand-500 blur-3xl opacity-50" />
            <div className="relative h-14 w-14 rounded-2xl gradient-brand flex items-center justify-center text-white font-extrabold text-2xl shadow-brand-glow">
              G
            </div>
          </div>
        </div>

        <div className="text-center mb-8 animate-fade-in">
          <h1 className="font-display text-4xl text-white tracking-tighter">Criar workspace</h1>
          <p className="mt-2 text-sm text-stone-400">Você será o owner do workspace</p>
        </div>

        <form action={formAction} className="glass rounded-2xl p-6 space-y-4 animate-fade-in">
          <Field
            id="workspaceName"
            name="workspaceName"
            label="Nome do workspace"
            required
            minLength={2}
            maxLength={80}
            placeholder="Garcia Sadler"
          />
          <Field
            id="name"
            name="name"
            label="Seu nome"
            required
            minLength={2}
            autoComplete="name"
          />
          <Field
            id="email"
            name="email"
            label="Email"
            type="email"
            required
            autoComplete="email"
          />
          <div>
            <Field
              id="password"
              name="password"
              label="Senha"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
            />
            <p className="mt-1 text-[10px] text-stone-500 uppercase tracking-wider">
              Mínimo 8 caracteres
            </p>
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
            <span className="relative z-10">{pending ? "Criando..." : "Criar workspace"}</span>
            <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-stone-400 animate-fade-in">
          Já tem conta?{" "}
          <Link
            href="/login"
            className="font-semibold text-brand-400 hover:text-brand-300 transition"
          >
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}

function Field({
  id,
  label,
  ...props
}: {
  id: string;
  label: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-[10px] font-semibold uppercase tracking-[0.15em] text-stone-400 mb-2"
      >
        {label}
      </label>
      <input
        id={id}
        {...props}
        className="w-full bg-transparent border-0 border-b border-white/10 px-1 py-2 text-sm text-white placeholder:text-stone-500 focus:outline-none focus:border-brand-500 transition"
      />
    </div>
  );
}
