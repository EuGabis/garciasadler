"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const schema = z.object({
  name: z.string().min(1).max(120),
  phone: z.string().min(8).max(20),
  email: z.string().email().or(z.literal("")).optional(),
  productInterest: z.string().max(200).optional(),
  source: z.string().max(80).optional(),
  notes: z.string().max(2000).optional(),
});

export type CreateState = { error?: string } | null;

export async function createContactAction(
  _prev: CreateState,
  formData: FormData
): Promise<CreateState> {
  const session = await auth();
  if (!session?.user) return { error: "Não autenticado." };

  const parsed = schema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email") || "",
    productInterest: formData.get("productInterest") ?? "",
    source: formData.get("source") ?? "",
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) return { error: "Dados inválidos." };

  const cleanPhone = parsed.data.phone.replace(/\D/g, "");

  const existing = await prisma.contact.findUnique({
    where: { workspaceId_phone: { workspaceId: session.user.workspaceId, phone: cleanPhone } },
  });
  if (existing) return { error: "Já existe contato com esse telefone." };

  const contact = await prisma.contact.create({
    data: {
      workspaceId: session.user.workspaceId,
      name: parsed.data.name,
      phone: cleanPhone,
      email: parsed.data.email || null,
      productInterest: parsed.data.productInterest || null,
      source: parsed.data.source || "manual",
      notes: parsed.data.notes || null,
    },
  });

  revalidatePath("/contatos");
  redirect(`/contatos/${contact.id}`);
}
