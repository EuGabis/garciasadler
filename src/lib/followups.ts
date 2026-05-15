import { prisma } from "@/lib/db";
import { sendWhatsAppText } from "@/lib/evolution";
import { publishRealtime } from "@/lib/pusher-server";
import type { FollowUp, FollowUpTriggerType } from "@/generated/prisma/client";

/**
 * Motor de follow-ups (executado por cron).
 *
 * Gatilhos:
 * - `inactivity`: conversa sem mensagem há N horas
 * - `column_entry`: conversa está numa coluna específica do pipeline
 *
 * Política de execução:
 * - Cada par (followUpId, conversationId) tem um `FollowUpLog` rastreando
 *   quantas vezes disparou e quando foi a última vez.
 * - Respeita `maxTimes` por par.
 * - Só dispara se a última mensagem da conversa for inbound (não responde
 *   sobre nossa própria mensagem).
 * - Espera no mínimo `inactivityHours` desde a última atividade.
 */

const MIN_INTERVAL_BETWEEN_FOLLOWUPS_MS = 1000 * 60 * 60; // 1h entre execuções pra evitar spam

type WorkspaceConfig = {
  id: string;
  evolutionUrl: string;
  evolutionKey: string;
  evolutionInstance: string;
};

type Result = {
  processedFollowUps: number;
  attemptedSends: number;
  successfulSends: number;
  errors: string[];
};

async function evaluateInactivity(
  followUp: FollowUp,
  workspace: WorkspaceConfig
): Promise<{ conversationId: string; phone: string }[]> {
  const hours = followUp.inactivityHours ?? 24;
  const threshold = new Date(Date.now() - hours * 60 * 60 * 1000);

  // Conversas abertas/pending com última mensagem antes do threshold
  const candidates = await prisma.conversation.findMany({
    where: {
      workspaceId: workspace.id,
      status: { in: ["open", "pending"] },
      lastMessageAt: { lte: threshold },
    },
    select: {
      id: true,
      contact: { select: { phone: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { direction: true },
      },
    },
  });

  return candidates
    .filter((c) => c.messages[0]?.direction === "inbound")
    .map((c) => ({ conversationId: c.id, phone: c.contact.phone }));
}

async function evaluateColumnEntry(
  followUp: FollowUp,
  workspace: WorkspaceConfig
): Promise<{ conversationId: string; phone: string }[]> {
  if (!followUp.columnId) return [];

  const cards = await prisma.kanbanCard.findMany({
    where: { columnId: followUp.columnId },
    select: {
      conversationId: true,
      conversation: {
        select: {
          workspaceId: true,
          status: true,
          contact: { select: { phone: true } },
        },
      },
    },
  });

  return cards
    .filter(
      (card) =>
        card.conversation.workspaceId === workspace.id &&
        (card.conversation.status === "open" || card.conversation.status === "pending")
    )
    .map((card) => ({
      conversationId: card.conversationId,
      phone: card.conversation.contact.phone,
    }));
}

async function executeOne(
  followUp: FollowUp,
  workspace: WorkspaceConfig,
  result: Result
): Promise<void> {
  const trigger = followUp.triggerType as FollowUpTriggerType;
  const candidates =
    trigger === "inactivity"
      ? await evaluateInactivity(followUp, workspace)
      : trigger === "column_entry"
      ? await evaluateColumnEntry(followUp, workspace)
      : [];

  if (candidates.length === 0) return;

  // Logs existentes pra filtrar maxTimes e intervalo mínimo
  const logs = await prisma.followUpLog.findMany({
    where: {
      followUpId: followUp.id,
      conversationId: { in: candidates.map((c) => c.conversationId) },
    },
  });
  const byConv = new Map(logs.map((l) => [l.conversationId, l]));
  const now = Date.now();

  for (const candidate of candidates) {
    const log = byConv.get(candidate.conversationId);
    if (log) {
      if (log.sentCount >= followUp.maxTimes) continue;
      if (now - log.lastSentAt.getTime() < MIN_INTERVAL_BETWEEN_FOLLOWUPS_MS) continue;
    }

    result.attemptedSends++;
    try {
      await sendWhatsAppText(candidate.phone, followUp.message, {
        url: workspace.evolutionUrl,
        key: workspace.evolutionKey,
        instance: workspace.evolutionInstance,
      });

      await prisma.message.create({
        data: {
          conversationId: candidate.conversationId,
          role: "assistant",
          direction: "outbound",
          type: "text",
          status: "sent",
          content: followUp.message,
        },
      });

      const truncated =
        followUp.message.length > 80 ? followUp.message.slice(0, 79) + "…" : followUp.message;
      await prisma.conversation.update({
        where: { id: candidate.conversationId },
        data: { lastMessage: truncated, lastMessageAt: new Date() },
      });

      // Transferência (se configurada)
      if (followUp.transferToUserId) {
        const user = await prisma.user.findFirst({
          where: { id: followUp.transferToUserId, workspaceId: workspace.id },
          select: { id: true },
        });
        if (user) {
          await prisma.conversationAssignment.upsert({
            where: {
              conversationId_userId: {
                conversationId: candidate.conversationId,
                userId: user.id,
              },
            },
            update: {},
            create: { conversationId: candidate.conversationId, userId: user.id },
          });
        }
      }

      // Atualiza log
      if (log) {
        await prisma.followUpLog.update({
          where: { id: log.id },
          data: { sentCount: { increment: 1 }, lastSentAt: new Date() },
        });
      } else {
        await prisma.followUpLog.create({
          data: {
            followUpId: followUp.id,
            conversationId: candidate.conversationId,
            sentCount: 1,
          },
        });
      }

      await publishRealtime(workspace.id, {
        type: "message:new",
        conversationId: candidate.conversationId,
        preview: truncated,
      });

      result.successfulSends++;
    } catch (e) {
      const msg = (e as Error).message;
      result.errors.push(`followUp ${followUp.id} / conv ${candidate.conversationId}: ${msg}`);
      console.error("[followups] send failed:", msg);
    }
  }
}

export async function runFollowUps(): Promise<Result> {
  const result: Result = {
    processedFollowUps: 0,
    attemptedSends: 0,
    successfulSends: 0,
    errors: [],
  };

  const followUps = await prisma.followUp.findMany({
    where: { enabled: true },
    include: {
      workspace: {
        select: {
          id: true,
          active: true,
          evolutionUrl: true,
          evolutionKey: true,
          evolutionInstance: true,
        },
      },
    },
  });

  for (const followUp of followUps) {
    if (!followUp.workspace.active) continue;
    if (
      !followUp.workspace.evolutionUrl ||
      !followUp.workspace.evolutionKey ||
      !followUp.workspace.evolutionInstance
    ) {
      continue;
    }

    result.processedFollowUps++;
    try {
      await executeOne(followUp, {
        id: followUp.workspace.id,
        evolutionUrl: followUp.workspace.evolutionUrl,
        evolutionKey: followUp.workspace.evolutionKey,
        evolutionInstance: followUp.workspace.evolutionInstance,
      }, result);
    } catch (e) {
      const msg = (e as Error).message;
      result.errors.push(`followUp ${followUp.id} workspace ${followUp.workspaceId}: ${msg}`);
      console.error("[followups] workspace exec failed:", msg);
    }
  }

  return result;
}
