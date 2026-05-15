"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const createSchema = z.object({
  title: z.string().min(1).max(60),
  content: z.string().min(1).max(2000),
});

const updateSchema = createSchema.extend({ id: z.string().min(1) });

export type QuickReplyState = { error?: string; ok?: boolean } | null;

export async function createQuickReplyAction(
  _prev: QuickReplyState,
  formData: FormData
): Promise<QuickReplyState> {
  const session = await auth();
  if (!session?.user) return { error: "Não autenticado." };

  const parsed = createSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
  });
  if (!parsed.success) return { error: "Dados inválidos." };

  await prisma.quickReply.create({
    data: { workspaceId: session.user.workspaceId, ...parsed.data },
  });

  revalidatePath("/respostas-rapidas");
  return { ok: true };
}

export async function updateQuickReplyAction(
  _prev: QuickReplyState,
  formData: FormData
): Promise<QuickReplyState> {
  const session = await auth();
  if (!session?.user) return { error: "Não autenticado." };

  const parsed = updateSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    content: formData.get("content"),
  });
  if (!parsed.success) return { error: "Dados inválidos." };

  const reply = await prisma.quickReply.findFirst({
    where: { id: parsed.data.id, workspaceId: session.user.workspaceId },
  });
  if (!reply) return { error: "Resposta não encontrada." };

  await prisma.quickReply.update({
    where: { id: parsed.data.id },
    data: { title: parsed.data.title, content: parsed.data.content },
  });

  revalidatePath("/respostas-rapidas");
  return { ok: true };
}

export async function deleteQuickReplyAction(replyId: string): Promise<void> {
  const session = await auth();
  if (!session?.user) return;
  await prisma.quickReply.deleteMany({
    where: { id: replyId, workspaceId: session.user.workspaceId },
  });
  revalidatePath("/respostas-rapidas");
}
