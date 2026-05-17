"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function toggleAiAction(conversationId: string): Promise<{ ok?: boolean; enabled?: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user) return { error: "Não autenticado." };

  const conv = await prisma.conversation.findFirst({
    where: { id: conversationId, workspaceId: session.user.workspaceId },
    select: { aiEnabled: true },
  });
  if (!conv) return { error: "Conversa não encontrada." };

  const next = !conv.aiEnabled;
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { aiEnabled: next },
  });

  revalidatePath(`/conversations/${conversationId}`);
  return { ok: true, enabled: next };
}
