import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { normalizePhone } from "@/lib/evolution";
import { env } from "@/lib/env";

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

function extractText(payload: EvolutionMessageUpsert): string | null {
  const msg = payload.data?.message;
  if (!msg) return null;
  return msg.conversation ?? msg.extendedTextMessage?.text ?? null;
}

function truncate(s: string, n = 80): string {
  return s.length <= n ? s : s.slice(0, n - 1) + "…";
}

export async function POST(req: NextRequest) {
  if (env.WEBHOOK_SECRET) {
    const provided = req.headers.get("x-webhook-secret");
    if (provided !== env.WEBHOOK_SECRET) {
      return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }

  let payload: EvolutionMessageUpsert;
  try {
    payload = (await req.json()) as EvolutionMessageUpsert;
  } catch {
    return Response.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  if (payload.event && payload.event !== "messages.upsert") {
    return Response.json({ ok: true, ignored: payload.event });
  }

  const instance = payload.instance;
  if (!instance) return Response.json({ ok: true, ignored: "no instance" });

  const workspace = await prisma.workspace.findFirst({
    where: { evolutionInstance: instance, active: true },
    select: { id: true },
  });
  if (!workspace) return Response.json({ ok: true, ignored: "workspace not found" });

  const fromMe = payload.data?.key?.fromMe;
  const remoteJid = payload.data?.key?.remoteJid;
  const evolutionId = payload.data?.key?.id ?? null;
  if (fromMe || !remoteJid) return Response.json({ ok: true, ignored: "fromMe or no jid" });
  if (remoteJid.endsWith("@g.us")) return Response.json({ ok: true, ignored: "group" });

  const text = extractText(payload);
  if (!text) return Response.json({ ok: true, ignored: "no text" });

  const phone = normalizePhone(remoteJid);
  const pushName = payload.data?.pushName ?? phone;

  const contact = await prisma.contact.upsert({
    where: { workspaceId_phone: { workspaceId: workspace.id, phone } },
    update: { name: pushName },
    create: { workspaceId: workspace.id, phone, name: pushName, source: "whatsapp" },
  });

  const existing = await prisma.conversation.findFirst({
    where: {
      workspaceId: workspace.id,
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
          unreadCount: { increment: 1 },
        },
      })
    : await prisma.conversation.create({
        data: {
          workspaceId: workspace.id,
          contactId: contact.id,
          channel: "whatsapp",
          status: "open",
          lastMessage: truncate(text),
          lastMessageAt: new Date(),
          unreadCount: 1,
        },
      });

  await prisma.message.create({
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

  // IA fica desligada por padrão — será reativada na Fase 9 (AgentConfig por workspace)

  return Response.json({ ok: true, conversationId: conversation.id });
}

export async function GET() {
  return Response.json({ ok: true, service: "garcia-sadler webhook" });
}
