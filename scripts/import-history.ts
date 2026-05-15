/* eslint-disable @typescript-eslint/no-explicit-any */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const CHAT_LIMIT = Number(process.env.IMPORT_CHAT_LIMIT ?? 50);

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "").replace(/@.*$/, "");
}

function pickPhone(chat: any): string | null {
  // Prefere remoteJidAlt da lastMessage (formato @s.whatsapp.net legível)
  const alt = chat?.lastMessage?.key?.remoteJidAlt as string | undefined;
  if (alt && alt.endsWith("@s.whatsapp.net")) return normalizePhone(alt);
  const main = chat?.remoteJid as string | undefined;
  if (main && main.endsWith("@s.whatsapp.net")) return normalizePhone(main);
  return null;
}

function extractText(msg: any): string | null {
  if (!msg) return null;
  return (
    msg.conversation ??
    msg.extendedTextMessage?.text ??
    msg.imageMessage?.caption ??
    msg.videoMessage?.caption ??
    null
  );
}

function mapStatus(s: string | undefined): "pending" | "sent" | "delivered" | "read" | "failed" {
  const v = String(s ?? "").toUpperCase();
  if (v === "READ" || v === "PLAYED") return "read";
  if (v === "DELIVERY_ACK" || v === "DELIVERED") return "delivered";
  if (v === "SERVER_ACK" || v === "SENT") return "sent";
  if (v === "ERROR" || v === "FAILED") return "failed";
  return "sent";
}

async function main() {
  const workspace = await prisma.workspace.findFirst({
    where: { evolutionInstance: { not: null } },
    select: {
      id: true,
      slug: true,
      evolutionUrl: true,
      evolutionKey: true,
      evolutionInstance: true,
    },
  });
  if (!workspace || !workspace.evolutionUrl || !workspace.evolutionKey || !workspace.evolutionInstance) {
    console.error("Nenhum workspace com Evolution configurado.");
    process.exit(1);
  }

  console.log(`Importando para workspace ${workspace.slug} (instância ${workspace.evolutionInstance})...`);

  const base = workspace.evolutionUrl.replace(/\/$/, "");
  const instance = encodeURIComponent(workspace.evolutionInstance);
  const headers = { "Content-Type": "application/json", apikey: workspace.evolutionKey };

  const r = await fetch(`${base}/chat/findChats/${instance}`, {
    method: "POST",
    headers,
    body: JSON.stringify({}),
  });
  if (!r.ok) {
    console.error(`findChats falhou (${r.status}): ${await r.text()}`);
    process.exit(1);
  }
  const allChats = (await r.json()) as any[];

  // Ordena por updatedAt desc e limita
  const sorted = allChats
    .filter((c) => c?.lastMessage)
    .sort((a, b) => {
      const ta = new Date(a.updatedAt ?? a.lastMessage?.messageTimestamp ?? 0).getTime();
      const tb = new Date(b.updatedAt ?? b.lastMessage?.messageTimestamp ?? 0).getTime();
      return tb - ta;
    })
    .slice(0, CHAT_LIMIT);

  console.log(`${allChats.length} chats no Evolution, processando os ${sorted.length} mais recentes...`);

  let imported = 0;
  let skipped = 0;
  let messagesCreated = 0;

  for (const chat of sorted) {
    const phone = pickPhone(chat);
    if (!phone) {
      skipped++;
      continue;
    }

    const pushName = (chat.pushName as string | null) ?? (chat.lastMessage?.pushName as string | null) ?? phone;
    const text = extractText(chat.lastMessage?.message);
    if (!text) {
      skipped++;
      continue;
    }

    const fromMe = !!chat.lastMessage?.key?.fromMe;
    const evolutionId = chat.lastMessage?.key?.id as string | undefined;
    const ts = chat.lastMessage?.messageTimestamp as number | undefined;
    const lastDate = ts ? new Date(ts * 1000) : new Date(chat.updatedAt ?? Date.now());

    const contact = await prisma.contact.upsert({
      where: { workspaceId_phone: { workspaceId: workspace.id, phone } },
      update: { name: pushName || phone },
      create: { workspaceId: workspace.id, phone, name: pushName || phone, source: "whatsapp" },
    });

    const conversation = await prisma.conversation.findFirst({
      where: { workspaceId: workspace.id, contactId: contact.id, status: { in: ["open", "pending"] } },
      select: { id: true },
    });

    const truncated = text.length > 80 ? text.slice(0, 79) + "…" : text;

    const conv = conversation
      ? await prisma.conversation.update({
          where: { id: conversation.id },
          data: { lastMessage: truncated, lastMessageAt: lastDate, unreadCount: chat.unreadCount ?? 0 },
        })
      : await prisma.conversation.create({
          data: {
            workspaceId: workspace.id,
            contactId: contact.id,
            channel: "whatsapp",
            status: "open",
            lastMessage: truncated,
            lastMessageAt: lastDate,
            unreadCount: chat.unreadCount ?? 0,
          },
        });

    if (evolutionId) {
      const exists = await prisma.message.findUnique({
        where: { evolutionId },
        select: { id: true },
      });
      if (exists) {
        imported++;
        continue;
      }
    }

    await prisma.message.create({
      data: {
        conversationId: conv.id,
        role: fromMe ? "assistant" : "user",
        direction: fromMe ? "outbound" : "inbound",
        type: "text",
        status: fromMe ? mapStatus(chat.lastMessage?.status) : "delivered",
        content: text,
        evolutionId,
        createdAt: lastDate,
      },
    });
    messagesCreated++;
    imported++;
  }

  console.log(`\nResultado:`);
  console.log(`  importados: ${imported} chats`);
  console.log(`  mensagens criadas: ${messagesCreated}`);
  console.log(`  pulados (sem telefone/texto): ${skipped}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
