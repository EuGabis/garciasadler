import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { normalizePhone } from "@/lib/evolution";
import { env } from "@/lib/env";
import { publishRealtime } from "@/lib/pusher-server";
import type { MessageStatus } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

type EvolutionMessageUpsert = {
  event?: string;
  instance?: string;
  data?: {
    key?: {
      remoteJid?: string;
      fromMe?: boolean;
      id?: string;
    };
    pushName?: string;
    message?: {
      conversation?: string;
      extendedTextMessage?: { text?: string };
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

function extractText(payload: EvolutionMessageUpsert): string | null {
  const msg = payload.data?.message;
  if (!msg) return null;
  return msg.conversation ?? msg.extendedTextMessage?.text ?? null;
}

function truncate(s: string, n = 80): string {
  return s.length <= n ? s : s.slice(0, n - 1) + "…";
}

/**
 * Map Baileys/Evolution ack code or string to our MessageStatus enum.
 * Baileys: 0=ERROR 1=PENDING 2=SERVER_ACK 3=DELIVERY_ACK 4=READ 5=PLAYED
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

async function handleMessageUpsert(payload: EvolutionMessageUpsert, workspaceId: string) {
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

  const text = extractText(payload);
  if (!text) return Response.json({ ok: true, ignored: "no text" });

  const phone = normalizePhone(remoteJid);
  const pushName = payload.data?.pushName ?? phone;

  const contact = await prisma.contact.upsert({
    where: { workspaceId_phone: { workspaceId, phone } },
    update: fromMe ? {} : { name: pushName },
    create: { workspaceId, phone, name: pushName, source: "whatsapp" },
  });

  const existing = await prisma.conversation.findFirst({
    where: {
      workspaceId,
      contactId: contact.id,
      status: { in: ["open", "pending"] },
    },
    select: { id: true },
  });

  const conversation = existing
    ? await prisma.conversation.update({
        where: { id: existing.id },
        data: {
          lastMessage: truncate(text),
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
          lastMessage: truncate(text),
          lastMessageAt: new Date(),
          unreadCount: fromMe ? 0 : 1,
        },
      });

  if (fromMe) {
    const pending = await prisma.message.findFirst({
      where: {
        conversationId: conversation.id,
        direction: "outbound",
        content: text,
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

    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        direction: "outbound",
        type: "text",
        status: "sent",
        content: text,
        evolutionId: evolutionId ?? undefined,
      },
    });

    await publishRealtime(workspaceId, {
      type: "message:new",
      conversationId: conversation.id,
      preview: truncate(text),
    });

    return Response.json({ ok: true, source: "device", messageId: message.id });
  }

  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: "user",
      direction: "inbound",
      type: "text",
      status: "delivered",
      content: text,
      evolutionId: evolutionId ?? undefined,
    },
  });

  await publishRealtime(workspaceId, {
    type: "message:new",
    conversationId: conversation.id,
    preview: truncate(text),
  });

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

  // Não regredir status: read > delivered > sent > pending > failed
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
  if (env.WEBHOOK_SECRET) {
    const provided = req.headers.get("x-webhook-secret");
    if (provided !== env.WEBHOOK_SECRET) {
      return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
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
    select: { id: true },
  });
  if (!workspace) return Response.json({ ok: true, ignored: "workspace not found" });

  if (event === "messages.upsert" || event === "" || event === "MESSAGES_UPSERT") {
    return await handleMessageUpsert(payload as EvolutionMessageUpsert, workspace.id);
  }

  if (event === "messages.update" || event === "MESSAGES_UPDATE") {
    return await handleMessageUpdate(payload as EvolutionMessageUpdate, workspace.id);
  }

  return Response.json({ ok: true, ignored: `event ${event}` });
}

export async function GET() {
  return Response.json({ ok: true, service: "garcia-sadler webhook" });
}
