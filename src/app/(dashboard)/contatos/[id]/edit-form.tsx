"use client";

import { useActionState } from "react";
import { Check } from "lucide-react";
import { updateContactAction, type UpdateState } from "./actions";

type Contact = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  productInterest: string | null;
  source: string | null;
  notes: string | null;
  status: string;
};

const INPUT =
  "w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3.5 py-2 text-[13px] text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition";

const LABEL =
  "block text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-600 dark:text-stone-400 mb-1.5";

export function EditForm({ contact }: { contact: Contact }) {
  const [state, formAction, pending] = useActionState<UpdateState, FormData>(
    updateContactAction,
    null
  );

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="contactId" value={contact.id} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className={LABEL}>
            Nome
          </label>
          <input
            id="name"
            name="name"
            defaultValue={contact.name}
            required
            minLength={1}
            maxLength={120}
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor="phone" className={LABEL}>
            Telefone
          </label>
          <input
            id="phone"
            name="phone"
            defaultValue={contact.phone}
            required
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
            defaultValue={contact.email ?? ""}
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor="status" className={LABEL}>
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={contact.status}
            className={INPUT}
          >
            <option value="active">Ativo</option>
            <option value="archived">Arquivado</option>
            <option value="blocked">Bloqueado</option>
          </select>
        </div>
        <div>
          <label htmlFor="productInterest" className={LABEL}>
            Produto/serviço de interesse
          </label>
          <input
            id="productInterest"
            name="productInterest"
            defaultValue={contact.productInterest ?? ""}
            placeholder="ex: cimento, tijolos, areia…"
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor="source" className={LABEL}>
            Origem
          </label>
          <input
            id="source"
            name="source"
            defaultValue={contact.source ?? ""}
            placeholder="ex: whatsapp, indicação, anúncio"
            className={INPUT}
          />
        </div>
      </div>

      <div>
        <label htmlFor="notes" className={LABEL}>
          Anotações internas
        </label>
        <textarea
          id="notes"
          name="notes"
          defaultValue={contact.notes ?? ""}
          rows={4}
          maxLength={2000}
          placeholder="Visíveis só pra equipe…"
          className={`${INPUT} resize-none`}
        />
      </div>

      <div className="flex items-center gap-3 pt-2 border-t border-stone-100 dark:border-stone-800">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-[13px] font-medium shadow-sm transition-colors"
        >
          {pending ? "Salvando…" : "Salvar alterações"}
        </button>
        {state?.ok && (
          <span className="inline-flex items-center gap-1 text-[12px] font-medium text-emerald-600 dark:text-emerald-400">
            <Check className="h-3.5 w-3.5" />
            Salvo
          </span>
        )}
        {state?.error && (
          <span className="text-[12px] text-red-600 dark:text-red-400">{state.error}</span>
        )}
      </div>
    </form>
  );
}
