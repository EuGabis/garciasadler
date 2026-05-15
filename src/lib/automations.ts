import { prisma } from "@/lib/db";
import { sendWhatsAppText } from "@/lib/evolution";
import { publishRealtime } from "@/lib/pusher-server";
import type { Automation, AutomationTriggerType } from "@/generated/prisma/client";

/**
 * Engine de automações.
 *
 * Avalia automações ativas e aplica ações encadeadas quando um trigger
 * dispara. Os triggers atuais são:
 *
 * - `first_message`: a conversa foi criada agora (primeira mensagem do contato)
 * - `keyword`: a mensagem contém pelo menos uma das palavras-chave (case-insensitive)
 *
 * Ações disponíveis (executadas em ordem, falha individual não derruba as outras):
 *
 * 1. `addLabelName` — anexa label (cria se não existir)
 * 2. `assignUserId` — atribui conversa ao agente
 * 3. `pipelineColumnId` — cria card na coluna do pipeline
 * 4. `replyMessage` — envia mensagem automática via Evolution e salva
 */

type Context = {
  workspaceId: string;
  conversationId: string;
  isFirstMessage: boolean;
  messageText: string;
  contactPhone: string;
  evolutionConfig: { url: string; key: string; instance: string } | null;
};

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

function matches(automation: Automation, ctx: Context): boolean {
  const trigger = automation.triggerType as AutomationTriggerType;

  if (trigger === "first_message") {
    return ctx.isFirstMessage;
  }
  if (trigger === "keyword") {
    if (!automation.keywords?.length) return false;
    const text = normalize(ctx.messageText);
    return automation.keywords.some((k) => text.includes(normalize(k)));
  }
  // 'no_reply' é tratado em follow-ups
  return false;
}

async function applyAddLabel(automation: Automation, ctx: Context): Promise<void> {
  if (!automation.addLabelName) return;

  const label = await prisma.label.upsert({
    where: {
      workspaceId_name: { workspaceId: ctx.workspaceId, name: automation.addLabelName },
    },
    update: {},
    create: {
      workspaceId: ctx.workspaceId,
      name: automation.addLabelName,
      color: "#6366f1",
    },
  });

  await prisma.conversationLabel.upsert({
    where: {
      conversationId_labelId: { conversationId: ctx.conversationId, labelId: label.id },
    },
    update: {},
    create: { conversationId: ctx.conversationId, labelId: label.id },
  });
}

async function applyAssign(automation: Automation, ctx: Context): Promise<void> {
  if (!automation.assignUserId) return;

  const user = await prisma.user.findFirst({
    where: { id: automation.assignUserId, workspaceId: ctx.workspaceId },
    select: { id: true },
  });
  if (!user) return;

  await prisma.conversationAssignment.upsert({
    where: {
      conversationId_userId: { conversationId: ctx.conversationId, userId: user.id },
    },
    update: {},
    create: { conversationId: ctx.conversationId, userId: user.id },
  });
}

async function applyKanban(automation: Automation, ctx: Context): Promise<void> {
  if (!automation.pipelineColumnId) return;

  const column = await prisma.kanbanColumn.findFirst({
    where: { id: automation.pipelineColumnId, workspaceId: ctx.workspaceId },
    select: { id: true, wipLimit: true, _count: { select: { cards: true } } },
  });
  if (!column) return;
  if (column.wipLimit && column._count.cards >= column.wipLimit) return;

  const existingCard = await prisma.kanbanCard.findUnique({
    where: { conversationId: ctx.conversationId },
  });
  if (existingCard) {
    // Move pra coluna alvo se ainda não está
    if (existingCard.columnId !== column.id) {
      await prisma.kanbanCard.update({
        where: { id: existingCard.id },
        data: { columnId: column.id, order: column._count.cards },
      });
    }
    return;
  }

  await prisma.kanbanCard.create({
    data: {
      columnId: column.id,
      conversationId: ctx.conversationId,
      order: column._count.cards,
    },
  });
}

async function applyReply(automation: Automation, ctx: Context): Promise<void> {
  if (!automation.replyMessage || !ctx.evolutionConfig) return;

  try {
    await sendWhatsAppText(ctx.contactPhone, automation.replyMessage, ctx.evolutionConfig);
  } catch (e) {
    console.error("[automations] reply send failed:", e);
    return;
  }

  await prisma.message.create({
    data: {
      conversationId: ctx.conversationId,
      role: "assistant",
      direction: "outbound",
      type: "text",
      status: "sent",
      content: automation.replyMessage,
    },
  });

  const truncated =
    automation.replyMessage.length > 80
      ? automation.replyMessage.slice(0, 79) + "…"
      : automation.replyMessage;
  await prisma.conversation.update({
    where: { id: ctx.conversationId },
    data: { lastMessage: truncated, lastMessageAt: new Date() },
  });
}

export async function runAutomations(ctx: Context): Promise<{ matched: number; applied: number }> {
  const automations = await prisma.automation.findMany({
    where: { workspaceId: ctx.workspaceId, enabled: true },
    orderBy: { createdAt: "asc" },
  });

  let matched = 0;
  let applied = 0;

  for (const automation of automations) {
    if (!matches(automation, ctx)) continue;
    matched++;

    // Aplicar cada ação isoladamente — falha de uma não bloqueia as outras
    const tasks: Array<Promise<void>> = [
      applyAddLabel(automation, ctx).catch((e) =>
        console.error("[automations] addLabel failed:", e)
      ),
      applyAssign(automation, ctx).catch((e) =>
        console.error("[automations] assign failed:", e)
      ),
      applyKanban(automation, ctx).catch((e) =>
        console.error("[automations] kanban failed:", e)
      ),
      applyReply(automation, ctx).catch((e) =>
        console.error("[automations] reply failed:", e)
      ),
    ];
    await Promise.all(tasks);
    applied++;
  }

  if (applied > 0) {
    await publishRealtime(ctx.workspaceId, {
      type: "conversation:updated",
      conversationId: ctx.conversationId,
    });
  }

  return { matched, applied };
}
