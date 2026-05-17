"use client";

import { useActionState } from "react";
import { updateContactAction, type UpdateState } from "./actions";
import { Button, Input, Label, Textarea } from "@/components/ui";

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
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="contactId" value={contact.id} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nome</Label>
          <Input
            id="name"
            name="name"
            defaultValue={contact.name}
            required
            minLength={1}
            maxLength={120}
          />
        </div>
        <div>
          <Label htmlFor="phone">Telefone</Label>
          <Input id="phone" name="phone" defaultValue={contact.phone} required />
        </div>
        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" defaultValue={contact.email ?? ""} />
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={contact.status}
            className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-stone-100 focus:outline-none focus:ring-2 focus:ring-brand-500/60"
          >
            <option value="active" className="bg-stone-900">
              Ativo
            </option>
            <option value="archived" className="bg-stone-900">
              Arquivado
            </option>
            <option value="blocked" className="bg-stone-900">
              Bloqueado
            </option>
          </select>
        </div>
        <div>
          <Label htmlFor="productInterest">Produto/serviço de interesse</Label>
          <Input
            id="productInterest"
            name="productInterest"
            defaultValue={contact.productInterest ?? ""}
            placeholder="ex: cimento, tijolos, areia..."
          />
        </div>
        <div>
          <Label htmlFor="source">Origem</Label>
          <Input
            id="source"
            name="source"
            defaultValue={contact.source ?? ""}
            placeholder="ex: whatsapp, indicação, anúncio"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Anotações internas</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={contact.notes ?? ""}
          rows={4}
          maxLength={2000}
          placeholder="Visíveis só pra equipe..."
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Salvar"}
        </Button>
        {state?.ok && <p className="text-xs text-emerald-300">Salvo.</p>}
        {state?.error && <p className="text-xs text-red-400">{state.error}</p>}
      </div>
    </form>
  );
}
