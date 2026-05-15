"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const createSchema = z.object({
  name: z.string().min(1).max(40),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

const updateSchema = createSchema.extend({ id: z.string().min(1) });

export type LabelState = { error?: string; ok?: boolean } | null;

export async function createLabelAction(_prev: LabelState, formData: FormData): Promise<LabelState> {
  const session = await auth();
  if (!session?.user) return { error: "Não autenticado." };

  const parsed = createSchema.safeParse({
    name: formData.get("name"),
    color: formData.get("color"),
  });
  if (!parsed.success) return { error: "Dados inválidos." };

  try {
    await prisma.label.create({
      data: { workspaceId: session.user.workspaceId, ...parsed.data },
    });
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") {
      return { error: "Já existe etiqueta com esse nome." };
    }
    throw e;
  }

  revalidatePath("/etiquetas");
  return { ok: true };
}

export async function updateLabelAction(_prev: LabelState, formData: FormData): Promise<LabelState> {
  const session = await auth();
  if (!session?.user) return { error: "Não autenticado." };

  const parsed = updateSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    color: formData.get("color"),
  });
  if (!parsed.success) return { error: "Dados inválidos." };

  const label = await prisma.label.findFirst({
    where: { id: parsed.data.id, workspaceId: session.user.workspaceId },
  });
  if (!label) return { error: "Etiqueta não encontrada." };

  try {
    await prisma.label.update({
      where: { id: parsed.data.id },
      data: { name: parsed.data.name, color: parsed.data.color },
    });
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") {
      return { error: "Já existe etiqueta com esse nome." };
    }
    throw e;
  }

  revalidatePath("/etiquetas");
  return { ok: true };
}

export async function deleteLabelAction(labelId: string): Promise<void> {
  const session = await auth();
  if (!session?.user) return;
  await prisma.label.deleteMany({
    where: { id: labelId, workspaceId: session.user.workspaceId },
  });
  revalidatePath("/etiquetas");
}

export async function toggleLabelOnConversationAction(
  conversationId: string,
  labelId: string
): Promise<{ added: boolean } | { error: string }> {
  const session = await auth();
  if (!session?.user) return { error: "Não autenticado." };

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, workspaceId: session.user.workspaceId },
    select: { id: true },
  });
  if (!conversation) return { error: "Conversa não encontrada." };

  const label = await prisma.label.findFirst({
    where: { id: labelId, workspaceId: session.user.workspaceId },
    select: { id: true },
  });
  if (!label) return { error: "Etiqueta não encontrada." };

  const existing = await prisma.conversationLabel.findUnique({
    where: { conversationId_labelId: { conversationId, labelId } },
  });

  if (existing) {
    await prisma.conversationLabel.delete({
      where: { conversationId_labelId: { conversationId, labelId } },
    });
    revalidatePath(`/conversations/${conversationId}`);
    return { added: false };
  }

  await prisma.conversationLabel.create({ data: { conversationId, labelId } });
  revalidatePath(`/conversations/${conversationId}`);
  return { added: true };
}
