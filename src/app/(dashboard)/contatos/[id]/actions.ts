"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const updateSchema = z.object({
  contactId: z.string().min(1),
  name: z.string().min(1).max(120),
  phone: z.string().min(8).max(20),
  email: z.string().email().or(z.literal("")).optional(),
  productInterest: z.string().max(200).optional(),
  source: z.string().max(80).optional(),
  notes: z.string().max(2000).optional(),
  status: z.enum(["active", "archived", "blocked"]),
});

export type UpdateState = { error?: string; ok?: boolean } | null;

export async function updateContactAction(
  _prev: UpdateState,
  formData: FormData
): Promise<UpdateState> {
  const session = await auth();
  if (!session?.user) return { error: "Não autenticado." };

  const parsed = updateSchema.safeParse({
    contactId: formData.get("contactId"),
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email") || "",
    productInterest: formData.get("productInterest") ?? "",
    source: formData.get("source") ?? "",
    notes: formData.get("notes") ?? "",
    status: formData.get("status"),
  });
  if (!parsed.success) return { error: "Dados inválidos." };

  const data = parsed.data;
  const cleanPhone = data.phone.replace(/\D/g, "");

  const existing = await prisma.contact.findFirst({
    where: { id: data.contactId, workspaceId: session.user.workspaceId },
  });
  if (!existing) return { error: "Contato não encontrado." };

  // Se mudou o telefone, conferir colisão
  if (cleanPhone !== existing.phone) {
    const collision = await prisma.contact.findUnique({
      where: { workspaceId_phone: { workspaceId: session.user.workspaceId, phone: cleanPhone } },
    });
    if (collision) return { error: "Já existe outro contato com esse telefone." };
  }

  await prisma.contact.update({
    where: { id: data.contactId },
    data: {
      name: data.name,
      phone: cleanPhone,
      email: data.email || null,
      productInterest: data.productInterest || null,
      source: data.source || null,
      notes: data.notes || null,
      status: data.status,
    },
  });

  revalidatePath(`/contatos/${data.contactId}`);
  revalidatePath("/contatos");
  return { ok: true };
}

export async function deleteContactAction(contactId: string): Promise<void> {
  const session = await auth();
  if (!session?.user) return;
  await prisma.contact.deleteMany({
    where: { id: contactId, workspaceId: session.user.workspaceId },
  });
  revalidatePath("/contatos");
  redirect("/contatos");
}
