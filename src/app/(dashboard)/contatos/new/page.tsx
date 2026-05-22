"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createContactAction, type CreateState } from "./actions";

const INPUT =
  "w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3.5 py-2 text-[13px] text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition";

const LABEL =
  "block text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-600 dark:text-stone-400 mb-1.5";

export default function NewContactPage() {
  const [state, formAction, pending] = useActionState<CreateState, FormData>(
    createContactAction,
    null
  );

  return (
    <div className="p-6 lg:p-10 max-w-2xl mx-auto">
      <Link
        href="/contatos"
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 mb-6 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Voltar para contatos
      </Link>

      <header className="mb-7">
        <h1 className="text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
          Novo contato
        </h1>
        <p className="mt-1.5 text-[13px] text-stone-500">Cadastro manual.</p>
      </header>

      <div className="rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-stone-900 p-6">
        <form action={formAction} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className={LABEL}>
                Nome <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                required
                minLength={1}
                maxLength={120}
                className={INPUT}
              />
            </div>
            <div>
              <label htmlFor="phone" className={LABEL}>
                Telefone <span className="text-red-500">*</span>
              </label>
              <input
                id="phone"
                name="phone"
                required
                placeholder="5511999999999"
                className={INPUT}
              />
            </div>
            <div>
              <label htmlFor="email" className={LABEL}>
                E-mail
              </label>
              <input id="email" name="email" type="email" className={INPUT} />
            </div>
            <div>
              <label htmlFor="source" className={LABEL}>
                Origem
              </label>
              <input id="source" name="source" placeholder="manual" className={INPUT} />
            </div>
          </div>

          <div>
            <label htmlFor="productInterest" className={LABEL}>
              Produto/serviço de interesse
            </label>
            <input
              id="productInterest"
              name="productInterest"
              placeholder="ex: cimento, tijolos, areia…"
              className={INPUT}
            />
          </div>

          <div>
            <label htmlFor="notes" className={LABEL}>
              Anotações
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={4}
              maxLength={2000}
              className={`${INPUT} resize-none`}
            />
          </div>

          {state?.error && (
            <p className="text-[12.5px] text-red-600 dark:text-red-400 px-3 py-2 rounded-md bg-red-50 dark:bg-red-500/10 ring-1 ring-red-200/60 dark:ring-red-500/20">
              {state.error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
            <Link
              href="/contatos"
              className="inline-flex items-center justify-center h-9 px-3.5 rounded-lg text-[13px] font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-[13px] font-medium shadow-sm transition-colors"
            >
              {pending ? "Criando…" : "Criar contato"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
