"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { publishRealtime } from "@/lib/pusher-server";

export async function assignUserAction(
  conversationId: string,
  userId: string
): Promise<{ error?: string; ok?: boolean }> {
  const session = await auth();
  if (!session?.user) return { error: "Não autenticado." };

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, workspaceId: session.user.workspaceId },
    select: { id: true },
  });
  if (!conversation) return { error: "Conversa não encontrada." };

  const user = await prisma.user.findFirst({
    where: { id: userId, workspaceId: session.user.workspaceId },
    select: { id: true },
  });
  if (!user) return { error: "Usuário não encontrado." };

  try {
    await prisma.conversationAssignment.create({
      data: { conversationId, userId },
    });
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") {
      return { ok: true }; // Já estava atribuído
    }
    throw e;
  }

  await publishRealtime(session.user.workspaceId, {
    type: "conversation:updated",
    conversationId,
  });

  revalidatePath(`/conversations/${conversationId}`);
  revalidatePath("/conversations");
  return { ok: true };
}

export async function unassignUserAction(
  conversationId: string,
  userId: string
): Promise<{ error?: string; ok?: boolean }> {
  const session = await auth();
  if (!session?.user) return { error: "Não autenticado." };

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, workspaceId: session.user.workspaceId },
    select: { id: true },
  });
  if (!conversation) return { error: "Conversa não encontrada." };

  await prisma.conversationAssignment.deleteMany({
    where: { conversationId, userId },
  });

  await publishRealtime(session.user.workspaceId, {
    type: "conversation:updated",
    conversationId,
  });

  revalidatePath(`/conversations/${conversationId}`);
  revalidatePath("/conversations");
  return { ok: true };
}
