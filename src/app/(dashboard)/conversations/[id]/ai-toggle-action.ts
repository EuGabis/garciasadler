"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getEvolutionConfig } from "@/lib/workspace";
import { invokeAiResponse } from "@/lib/ai-respond";
import { logger } from "@/lib/logger";

export async function toggleAiAction(
  conversationId: string
): Promise<{ ok?: boolean; enabled?: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user) return { error: "Não autenticado." };

  const conv = await prisma.conversation.findFirst({
    where: { id: conversationId, workspaceId: session.user.workspaceId },
    select: {
      aiEnabled: true,
      contact: { select: { phone: true } },
    },
  });
  if (!conv) return { error: "Conversa não encontrada." };

  const next = !conv.aiEnabled;
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { aiEnabled: next },
  });

  revalidatePath(`/conversations/${conversationId}`);

  // Quando religando (OFF→ON), se a última mensagem foi do CLIENTE
  // (inbound), dispara uma resposta imediata pra não deixar pendurado.
  // Sem isso, a IA só responderia na próxima msg nova que chegasse via webhook.
  if (next === true) {
    const lastMessage = await prisma.message.findFirst({
      where: { conversationId, role: { in: ["user", "assistant"] } },
      orderBy: { createdAt: "desc" },
      select: { direction: true },
    });

    if (lastMessage?.direction === "inbound") {
      const workspaceId = session.user.workspaceId;
      const evolutionConfig = await getEvolutionConfig(workspaceId);

      if (evolutionConfig) {
        after(async () => {
          try {
            await invokeAiResponse({
              workspaceId,
              conversationId,
              contactPhone: conv.contact.phone,
              evolutionConfig,
            });
          } catch (e) {
            logger("ai-toggle").error("ai resume failed", e, {
              workspaceId,
              conversationId,
            });
          }
        });
      } else {
        logger("ai-toggle").warn("no evolution config - skipping ai resume", {
          workspaceId,
          conversationId,
        });
      }
    }
  }

  return { ok: true, enabled: next };
}
