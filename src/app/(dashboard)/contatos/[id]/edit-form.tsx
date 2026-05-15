"use client";

import { useActionState } from "react";
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

export function EditForm({ contact }: { contact: Contact }) {
  const [state, formAction, pending] = useActionState<UpdateState, FormData>(
    updateContactAction,
    null
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="contactId" value={contact.id} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
            Nome
          </label>
          <input
            name="name"
            defaultValue={contact.name}
            required
            minLength={1}
            maxLength={120}
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
            Telefone
          </label>
          <input
            name="phone"
            defaultValue={contact.phone}
            required
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
            E-mail
          </label>
          <input
            name="email"
            type="email"
            defaultValue={contact.email ?? ""}
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
            Status
          </label>
          <select
            name="status"
            defaultValue={contact.status}
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="active">Ativo</option>
            <option value="archived">Arquivado</option>
            <option value="blocked">Bloqueado</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
            Produto/serviço de interesse
          </label>
          <input
            name="productInterest"
            defaultValue={contact.productInterest ?? ""}
            placeholder="ex: cimento, tijolos, areia..."
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
            Origem
          </label>
          <input
            name="source"
            defaultValue={contact.source ?? ""}
            placeholder="ex: whatsapp, indicação, anúncio"
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
          Anotações internas
        </label>
        <textarea
          name="notes"
          defaultValue={contact.notes ?? ""}
          rows={4}
          maxLength={2000}
          placeholder="Visíveis só pra equipe..."
          className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium transition"
        >
          {pending ? "Salvando..." : "Salvar"}
        </button>
        {state?.ok && <p className="text-xs text-emerald-600">Salvo.</p>}
        {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
      </div>
    </form>
  );
}
