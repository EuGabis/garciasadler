import { prisma, withDbRetry } from "@/lib/db";
import { generateReply } from "@/lib/openai";
import { sendWhatsAppText } from "@/lib/evolution";
import { publishRealtime } from "@/lib/pusher-server";
import { logger } from "@/lib/logger";

/**
 * Dispara uma resposta da IA pra uma conversa: gera o texto, envia pelo
 * WhatsApp via Evolution, persiste no DB e publica via Pusher.
 *
 * Usado por:
 *  - webhook (mensagem nova chega + aiEnabled=true)
 *  - toggle IA OFF→ON (responde a última msg pendente do cliente)
 *
 * Todas as escritas no Postgres passam por withDbRetry — a conexão pode cair
 * de forma transitória em serverless e o retry com conexão nova resolve.
 */
export async function invokeAiResponse(params: {
  workspaceId: string;
  conversationId: string;
  contactPhone: string;
  evolutionConfig: { url: string; key: string; instance: string };
}) {
  const aiLog = logger("webhook/ai", { workspaceId: params.workspaceId });

  const result = await withDbRetry(() =>
    generateReply({
      workspaceId: params.workspaceId,
      conversationId: params.conversationId,
    })
  );

  if (!result.ok) {
    aiLog.warn("ai skipped", { reason: result.reason, error: result.error });
    return { ok: false as const, reason: result.reason };
  }

  try {
    await sendWhatsAppText(params.contactPhone, result.reply, params.evolutionConfig);
  } catch (e) {
    aiLog.error("evolution send failed for ai reply", e, {
      conversationId: params.conversationId,
    });
    return { ok: false as const, reason: "evolution_send_failed" };
  }

  // Persiste a mensagem final (já texto puro, sem tool_calls).
  await withDbRetry(() =>
    prisma.message.create({
      data: {
        conversationId: params.conversationId,
        role: "assistant",
        direction: "outbound",
        type: "text",
        status: "sent",
        content: result.reply,
      },
    })
  );

  const truncated =
    result.reply.length > 80 ? result.reply.slice(0, 79) + "…" : result.reply;
  await withDbRetry(() =>
    prisma.conversation.update({
      where: { id: params.conversationId },
      data: { lastMessage: truncated, lastMessageAt: new Date() },
    })
  );

  // Realtime é best-effort: se falhar, não derruba a resposta (já foi enviada).
  try {
    await publishRealtime(params.workspaceId, {
      type: "message:new",
      conversationId: params.conversationId,
      preview: truncated,
    });
  } catch (e) {
    aiLog.warn("publishRealtime falhou (não-crítico)", {
      error: (e as Error).message,
    });
  }

  aiLog.info("ai reply sent", {
    conversationId: params.conversationId,
    rounds: result.rounds,
  });

  return { ok: true as const };
}
