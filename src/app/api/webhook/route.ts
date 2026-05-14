import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { generateReply } from "@/lib/openai";
import { sendWhatsAppText, normalizePhone } from "@/lib/evolution";
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

  const fromMe = payload.data?.key?.fromMe;
  const remoteJid = payload.data?.key?.remoteJid;
  if (fromMe || !remoteJid) return Response.json({ ok: true, ignored: "fromMe or no jid" });
  if (remoteJid.endsWith("@g.us")) return Response.json({ ok: true, ignored: "group" });

  const text = extractText(payload);
  if (!text) return Response.json({ ok: true, ignored: "no text" });

  const phone = normalizePhone(remoteJid);
  const name = payload.data?.pushName ?? null;

  const conversation = await prisma.conversation.upsert({
    where: { phone },
    update: { name: name ?? undefined },
    create: { phone, name: name ?? undefined },
  });

  try {
    const reply = await generateReply(conversation.id, text);
    if (reply) await sendWhatsAppText(phone, reply);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[webhook] erro ao gerar/enviar resposta:", err);
    try {
      await sendWhatsAppText(
        phone,
        "Desculpe, tive um problema técnico. Pode tentar de novo em instantes?"
      );
    } catch {
      // engole erro do fallback pra não travar o webhook
    }
    return Response.json({ ok: false, error: "internal" }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ ok: true, service: "garcia-bot webhook" });
}
