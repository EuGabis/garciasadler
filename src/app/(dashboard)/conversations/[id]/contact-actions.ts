"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const schema = z.object({
  contactId: z.string().min(1),
  field: z.enum(["name", "notes", "productInterest", "source", "email", "status"]),
  value: z.string().max(2000),
});

export type ContactUpdateState = { error?: string; ok?: boolean } | null;

export async function updateContactFieldAction(
  _prev: ContactUpdateState,
  formData: FormData
): Promise<ContactUpdateState> {
  const session = await auth();
  if (!session?.user) return { error: "Não autenticado." };

  const parsed = schema.safeParse({
    contactId: formData.get("contactId"),
    field: formData.get("field"),
    value: formData.get("value") ?? "",
  });
  if (!parsed.success) return { error: "Dados inválidos." };

  const contact = await prisma.contact.findFirst({
    where: { id: parsed.data.contactId, workspaceId: session.user.workspaceId },
    select: { id: true },
  });
  if (!contact) return { error: "Contato não encontrado." };

  const { field, value } = parsed.data;

  if (field === "status") {
    if (value !== "active" && value !== "archived" && value !== "blocked") {
      return { error: "Status inválido." };
    }
    await prisma.contact.update({
      where: { id: contact.id },
      data: { status: value },
    });
  } else if (field === "email") {
    if (value && !z.string().email().safeParse(value).success) {
      return { error: "E-mail inválido." };
    }
    await prisma.contact.update({
      where: { id: contact.id },
      data: { email: value || null },
    });
  } else {
    await prisma.contact.update({
      where: { id: contact.id },
      data: { [field]: value || null },
    });
  }

  revalidatePath("/conversations");
  return { ok: true };
}
