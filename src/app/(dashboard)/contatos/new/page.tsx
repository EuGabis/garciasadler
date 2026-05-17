"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createContactAction, type CreateState } from "./actions";
import { Button, Input, Label, Textarea, SectionCard, PageHeader } from "@/components/ui";

export default function NewContactPage() {
  const [state, formAction, pending] = useActionState<CreateState, FormData>(
    createContactAction,
    null
  );

  return (
    <div className="p-6 lg:p-10 max-w-2xl mx-auto text-stone-100">
      <Link
        href="/contatos"
        className="inline-flex items-center gap-1 text-xs uppercase tracking-wider text-stone-400 hover:text-brand-300 mb-6 transition"
      >
        <ArrowLeft className="h-3 w-3" />
        Contatos
      </Link>

      <PageHeader eyebrow="Cadastro" title="Novo contato" description="Cadastro manual." />

      <SectionCard>
        <form action={formAction} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input id="name" name="name" required minLength={1} maxLength={120} />
            </div>
            <div>
              <Label htmlFor="phone">Telefone *</Label>
              <Input id="phone" name="phone" required placeholder="5511999999999" />
            </div>
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" />
            </div>
            <div>
              <Label htmlFor="source">Origem</Label>
              <Input id="source" name="source" placeholder="manual" />
            </div>
          </div>

          <div>
            <Label htmlFor="productInterest">Produto/serviço de interesse</Label>
            <Input
              id="productInterest"
              name="productInterest"
              placeholder="ex: cimento, tijolos, areia..."
            />
          </div>

          <div>
            <Label htmlFor="notes">Anotações</Label>
            <Textarea id="notes" name="notes" rows={4} maxLength={2000} />
          </div>

          {state?.error && <p className="text-sm text-red-400">{state.error}</p>}

          <Button type="submit" disabled={pending} size="lg">
            {pending ? "Criando..." : "Criar contato"}
          </Button>
        </form>
      </SectionCard>
    </div>
  );
}
