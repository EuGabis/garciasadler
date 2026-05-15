import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { normalizePhone } from "@/lib/evolution";
import { env } from "@/lib/env";
import { publishRealtime } from "@/lib/pusher-server";
import { runAutomations } from "@/lib/automations";
import type { MessageStatus, MessageType } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

type EvolutionMediaMessage = {
  url?: string;
  mimetype?: string;
  caption?: string;
  fileName?: string;
  base64?: string;
};

type EvolutionMessageUpsert = {
  event?: string;
  instance?: string;
  data?: {
    key?: { remoteJid?: string; fromMe?: boolean; id?: string };
    pushName?: string;
    message?: {
      conversation?: string;
      extendedTextMessage?: { text?: string };
      imageMessage?: EvolutionMediaMessage;
      audioMessage?: EvolutionMediaMessage;
      videoMessage?: EvolutionMediaMessage;
      documentMessage?: EvolutionMediaMessage;
      stickerMessage?: EvolutionMediaMessage;
      base64?: string;
    };
    messageType?: string;
  };
};

type EvolutionMessageUpdate = {
  event?: string;
  instance?: string;
  data?: {
    keyId?: string;
    remoteJid?: string;
    fromMe?: boolean;
    status?: string | number;
    messageId?: string;
    messageStatus?: string | number;
  };
};

const OUTBOUND_DEDUP_WINDOW_MS = 15_000;

type ExtractedMessage = {
  type: MessageType;
  content: string;
  mediaBase64: string | null;
  mediaUrl: string | null;
  fileName: string | null;
};

function extract(payload: EvolutionMessageUpsert): ExtractedMessage | null {
  const msg = payload.data?.message;
  if (!msg) return null;

  // Texto puro
  if (msg.conversation) {
    return { type: "text", content: msg.conversation, mediaBase64: null, mediaUrl: null, fileName: null };
  }
  if (msg.extendedTextMessage?.text) {
    return {
      type: "text",
      content: msg.extendedTextMessage.text,
      mediaBase64: null,
      mediaUrl: null,
      fileName: null,
    };
  }

  // Mídia: o base64 vem em msg.base64 (no nível do message) quando habilitado no webhook
  const inlineBase64 = msg.base64 ?? null;

  const mediaTypes: Array<[keyof typeof msg, MessageType, string]> = [
    ["imageMessage", "image", "[imagem]"],
    ["videoMessage", "video", "[vídeo]"],
    ["audioMessage", "audio", "[áudio]"],
    ["documentMessage", "document", "[documento]"],
    ["stickerMessage", "image", "[figurinha]"],
  ];

  for (const [key, type, placeholder] of mediaTypes) {
    const media = msg[key] as EvolutionMediaMessage | undefined;
    if (!media) continue;
    const base64 = inlineBase64 ?? media.base64 ?? null;
    const caption = media.caption?.trim() ?? "";
    return {
      type,
      content: caption || placeholder,
      mediaBase64: base64,
      mediaUrl: media.url ?? null,
      fileName: media.fileName ?? null,
    };
  }

  return null;
}

function truncate(s: string, n = 80): string {
  return s.length <= n ? s : s.slice(0, n - 1) + "…";
}

/**
 * Baileys ack: 0=ERROR 1=PENDING 2=SERVER_ACK 3=DELIVERY_ACK 4=READ 5=PLAYED
 */
function mapStatus(raw: string | number | undefined): MessageStatus | null {
  if (raw === undefined || raw === null) return null;
  const s = String(raw).toUpperCase();
  if (s === "READ" || s === "PLAYED" || s === "4" || s === "5") return "read";
  if (s === "DELIVERY_ACK" || s === "DELIVERED" || s === "3") return "delivered";
  if (s === "SERVER_ACK" || s === "SENT" || s === "2") return "sent";
  if (s === "PENDING" || s === "1") return "pending";
  if (s === "ERROR" || s === "FAILED" || s === "0") return "failed";
  return null;
}

async function handleMessageUpsert(
  payload: EvolutionMessageUpsert,
  workspaceId: string,
  evolutionConfig: { url: string; key: string; instance: string } | null
) {
  const fromMe = !!payload.data?.key?.fromMe;
  const remoteJid = payload.data?.key?.remoteJid;
  const evolutionId = payload.data?.key?.id ?? null;
  if (!remoteJid) return Response.json({ ok: true, ignored: "no jid" });
  if (remoteJid.endsWith("@g.us")) return Response.json({ ok: true, ignored: "group" });

  if (evolutionId) {
    const exists = await prisma.message.findUnique({
      where: { evolutionId },
      select: { id: true },
    });
    if (exists) return Response.json({ ok: true, ignored: "duplicate evolutionId" });
  }

  const extracted = extract(payload);
  if (!extracted) return Response.json({ ok: true, ignored: "unsupported message type" });

  const phone = normalizePhone(remoteJid);
  const pushName = payload.data?.pushName ?? phone;

  const contact = await prisma.contact.upsert({
    where: { workspaceId_phone: { workspaceId, phone } },
    update: fromMe ? {} : { name: pushName },
    create: { workspaceId, phone, name: pushName, source: "whatsapp" },
  });

  // Prioriza conversa aberta; se não houver, reabre a última arquivada (preserva histórico)
  const openOrPending = await prisma.conversation.findFirst({
    where: { workspaceId, contactId: contact.id, status: { in: ["open", "pending"] } },
    select: { id: true },
  });
  const lastArchived = openOrPending
    ? null
    : await prisma.conversation.findFirst({
        where: { workspaceId, contactId: contact.id, status: { in: ["archived", "resolved"] } },
        orderBy: { lastMessageAt: "desc" },
        select: { id: true },
      });

  const reusedId = openOrPending?.id ?? lastArchived?.id ?? null;
  const previewText = truncate(extracted.content);
  const isFirstMessage = !openOrPending && !lastArchived;

  const conversation = reusedId
    ? await prisma.conversation.update({
        where: { id: reusedId },
        data: {
          status: "open",
          lastMessage: previewText,
          lastMessageAt: new Date(),
          ...(fromMe ? {} : { unreadCount: { increment: 1 } }),
        },
      })
    : await prisma.conversation.create({
        data: {
          workspaceId,
          contactId: contact.id,
          channel: "whatsapp",
          status: "open",
          lastMessage: previewText,
          lastMessageAt: new Date(),
          unreadCount: fromMe ? 0 : 1,
        },
      });

  if (fromMe) {
    // Dedup com mensagem de texto enviada pelo painel (sem evolutionId)
    if (extracted.type === "text") {
      const pending = await prisma.message.findFirst({
        where: {
          conversationId: conversation.id,
          direction: "outbound",
          type: "text",
          content: extracted.content,
          evolutionId: null,
          createdAt: { gte: new Date(Date.now() - OUTBOUND_DEDUP_WINDOW_MS) },
        },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });
      if (pending) {
        await prisma.message.update({
          where: { id: pending.id },
          data: { evolutionId: evolutionId ?? undefined, status: "sent" },
        });
        return Response.json({ ok: true, deduped: true, messageId: pending.id });
      }
    }

    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        direction: "outbound",
        type: extracted.type,
        status: "sent",
        content: extracted.content,
        mediaBase64: extracted.mediaBase64,
        mediaUrl: extracted.mediaUrl,
        fileName: extracted.fileName,
        evolutionId: evolutionId ?? undefined,
      },
    });

    await publishRealtime(workspaceId, {
      type: "message:new",
      conversationId: conversation.id,
      preview: previewText,
    });

    return Response.json({ ok: true, source: "device", messageId: message.id });
  }

  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: "user",
      direction: "inbound",
      type: extracted.type,
      status: "delivered",
      content: extracted.content,
      mediaBase64: extracted.mediaBase64,
      mediaUrl: extracted.mediaUrl,
      fileName: extracted.fileName,
      evolutionId: evolutionId ?? undefined,
    },
  });

  await publishRealtime(workspaceId, {
    type: "message:new",
    conversationId: conversation.id,
    preview: previewText,
  });

  // Automações: roda em background sem bloquear o ack do webhook
  runAutomations({
    workspaceId,
    conversationId: conversation.id,
    isFirstMessage,
    messageText: extracted.content,
    contactPhone: phone,
    evolutionConfig,
  }).catch((e) => console.error("[webhook] automations failed:", e));

  return Response.json({ ok: true, messageId: message.id });
}

async function handleMessageUpdate(payload: EvolutionMessageUpdate, workspaceId: string) {
  const data = payload.data;
  if (!data) return Response.json({ ok: true, ignored: "no data" });

  const evolutionId = data.keyId ?? data.messageId;
  if (!evolutionId) return Response.json({ ok: true, ignored: "no message id" });

  const newStatus = mapStatus(data.status ?? data.messageStatus);
  if (!newStatus) return Response.json({ ok: true, ignored: "unknown status" });

  const message = await prisma.message.findUnique({
    where: { evolutionId },
    select: { id: true, status: true, conversationId: true, conversation: { select: { workspaceId: true } } },
  });
  if (!message || message.conversation.workspaceId !== workspaceId) {
    return Response.json({ ok: true, ignored: "message not found in workspace" });
  }

  const order: Record<MessageStatus, number> = {
    failed: 0,
    pending: 1,
    sent: 2,
    delivered: 3,
    read: 4,
  };
  if (order[newStatus] <= order[message.status as MessageStatus]) {
    return Response.json({ ok: true, ignored: "status not progressing" });
  }

  await prisma.message.update({
    where: { id: message.id },
    data: { status: newStatus },
  });

  await publishRealtime(workspaceId, {
    type: "conversation:updated",
    conversationId: message.conversationId,
  });

  return Response.json({ ok: true, status: newStatus });
}

export async function POST(req: NextRequest) {
  // Fail-closed: webhook precisa de secret. Sem env setada, recusa todas as requests.
  if (!env.WEBHOOK_SECRET) {
    console.error("[webhook] WEBHOOK_SECRET não configurada — recusando request");
    return Response.json({ ok: false, error: "webhook secret not configured" }, { status: 503 });
  }
  const provided = req.headers.get("x-webhook-secret");
  if (provided !== env.WEBHOOK_SECRET) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let payload: EvolutionMessageUpsert | EvolutionMessageUpdate;
  try {
    payload = (await req.json()) as EvolutionMessageUpsert | EvolutionMessageUpdate;
  } catch {
    return Response.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const event = payload.event ?? "";
  const instance = payload.instance;
  if (!instance) return Response.json({ ok: true, ignored: "no instance" });

  const workspace = await prisma.workspace.findFirst({
    where: { evolutionInstance: instance, active: true },
    select: {
      id: true,
      evolutionUrl: true,
      evolutionKey: true,
      evolutionInstance: true,
    },
  });
  if (!workspace) return Response.json({ ok: true, ignored: "workspace not found" });

  const evolutionConfig =
    workspace.evolutionUrl && workspace.evolutionKey && workspace.evolutionInstance
      ? {
          url: workspace.evolutionUrl,
          key: workspace.evolutionKey,
          instance: workspace.evolutionInstance,
        }
      : null;

  if (event === "messages.upsert" || event === "" || event === "MESSAGES_UPSERT") {
    return await handleMessageUpsert(payload as EvolutionMessageUpsert, workspace.id, evolutionConfig);
  }

  if (event === "messages.update" || event === "MESSAGES_UPDATE") {
    return await handleMessageUpdate(payload as EvolutionMessageUpdate, workspace.id);
  }

  return Response.json({ ok: true, ignored: `event ${event}` });
}

export async function GET() {
  return Response.json({ ok: true, service: "garcia-sadler webhook" });
}
