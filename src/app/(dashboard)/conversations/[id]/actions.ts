"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  sendWhatsAppText,
  sendWhatsAppMedia,
  detectMediaType,
  type EvolutionMediaType,
} from "@/lib/evolution";
import { publishRealtime } from "@/lib/pusher-server";
import { buildEvolutionConfig } from "@/lib/workspace";
import { logger } from "@/lib/logger";
import type { MessageType } from "@/generated/prisma/client";

const log = logger("conversations/actions");

/** Evita vazar body/headers do Evolution pro cliente (pode conter detalhes internos). */
function genericEvolutionError(e: unknown): string {
  log.error("evolution send failed", e);
  return "Falha ao enviar via Evolution. Tente novamente em instantes.";
}

/**
 * Detecta MIME real via magic bytes (cobre os formatos comuns aceitos pelo WhatsApp).
 * Retorna null se não bateu nenhuma assinatura conhecida — nesse caso a gente
 * confia no claimed (defesa em profundidade, não bloqueia 100% mas pega mismatches óbvios).
 */
function sniffMime(buf: Buffer): string | null {
  if (buf.length < 4) return null;
  // PNG: 89 50 4E 47
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  // GIF: 47 49 46 38
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return "image/gif";
  // WEBP: RIFF....WEBP
  if (
    buf.length >= 12 &&
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) {
    return "image/webp";
  }
  // PDF: %PDF
  if (buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) return "application/pdf";
  // MP4 (ftyp): bytes 4..7 = "ftyp"
  if (buf.length >= 12 && buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70) {
    return "video/mp4";
  }
  // OGG: OggS
  if (buf[0] === 0x4f && buf[1] === 0x67 && buf[2] === 0x67 && buf[3] === 0x53) return "audio/ogg";
  // MP3 (ID3 ou frame sync)
  if (buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33) return "audio/mpeg";
  return null;
}

function mimeFamilyMatches(claimed: string, detected: string): boolean {
  // Mesma família (image/*, video/*, audio/*, application/*) é suficiente.
  const a = claimed.split("/")[0];
  const b = detected.split("/")[0];
  return a === b;
}

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB (limite serverless Vercel)

const schema = z.object({
  conversationId: z.string().min(1),
  text: z.string().min(1).max(4000),
});

export type SendState = { error?: string; ok?: boolean } | null;

export async function sendMessageAction(
  _prev: SendState,
  formData: FormData
): Promise<SendState> {
  const session = await auth();
  if (!session?.user) return { error: "Não autenticado." };

  const parsed = schema.safeParse({
    conversationId: formData.get("conversationId"),
    text: formData.get("text"),
  });
  if (!parsed.success) return { error: "Mensagem inválida." };

  const { conversationId, text } = parsed.data;

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, workspaceId: session.user.workspaceId },
    select: {
      id: true,
      contact: { select: { phone: true } },
      workspace: {
        select: { evolutionUrl: true, evolutionKey: true, evolutionInstance: true },
      },
    },
  });
  if (!conversation) return { error: "Conversa não encontrada." };

  const config = buildEvolutionConfig(
    conversation.workspace.evolutionUrl,
    conversation.workspace.evolutionKey,
    conversation.workspace.evolutionInstance
  );
  if (!config) {
    return { error: "Workspace não tem Evolution configurado." };
  }

  try {
    await sendWhatsAppText(conversation.contact.phone, text, config);
  } catch (e) {
    return { error: genericEvolutionError(e) };
  }

  await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId,
        senderId: session.user.id,
        role: "assistant",
        direction: "outbound",
        type: "text",
        status: "sent",
        content: text,
      },
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessage: text.length > 80 ? text.slice(0, 79) + "…" : text,
        lastMessageAt: new Date(),
        unreadCount: 0,
        // Sprint IA: agente humano assumiu, pausa IA nessa conversa
        aiEnabled: false,
      },
    }),
  ]);

  await publishRealtime(session.user.workspaceId, {
    type: "message:new",
    conversationId,
    preview: text.length > 80 ? text.slice(0, 79) + "…" : text,
  });

  revalidatePath(`/conversations/${conversationId}`);
  revalidatePath("/conversations");

  return { ok: true };
}

function mediaTypeToMessageType(t: EvolutionMediaType): MessageType {
  if (t === "image") return "image";
  if (t === "video") return "video";
  if (t === "audio") return "audio";
  return "document";
}

export async function sendMediaAction(
  _prev: SendState,
  formData: FormData
): Promise<SendState> {
  const session = await auth();
  if (!session?.user) return { error: "Não autenticado." };

  const conversationId = String(formData.get("conversationId") ?? "");
  const caption = String(formData.get("caption") ?? "").trim();
  const file = formData.get("file") as File | null;

  if (!conversationId || !file || !(file instanceof File) || file.size === 0) {
    return { error: "Arquivo inválido." };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { error: `Arquivo grande demais (máx ${MAX_FILE_SIZE / 1024 / 1024}MB).` };
  }

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, workspaceId: session.user.workspaceId },
    select: {
      id: true,
      contact: { select: { phone: true } },
      workspace: {
        select: { evolutionUrl: true, evolutionKey: true, evolutionInstance: true },
      },
    },
  });
  if (!conversation) return { error: "Conversa não encontrada." };

  const config = buildEvolutionConfig(
    conversation.workspace.evolutionUrl,
    conversation.workspace.evolutionKey,
    conversation.workspace.evolutionInstance
  );
  if (!config) {
    return { error: "Workspace não tem Evolution configurado." };
  }

  // M4: validação básica de MIME server-side via magic bytes
  const buf = Buffer.from(await file.arrayBuffer());
  const detectedMime = sniffMime(buf);
  const claimedMime = file.type || "application/octet-stream";
  // Bloqueia mismatch claro (image declarado mas magic bytes não são imagem)
  if (detectedMime && !mimeFamilyMatches(claimedMime, detectedMime)) {
    return { error: "Tipo do arquivo não confere com o conteúdo." };
  }

  const base64 = buf.toString("base64");
  const mediaType = detectMediaType(claimedMime);
  const messageType = mediaTypeToMessageType(mediaType);

  try {
    await sendWhatsAppMedia(
      {
        to: conversation.contact.phone,
        mediaType,
        base64,
        mimeType: file.type || "application/octet-stream",
        fileName: file.name,
        caption: caption || undefined,
      },
      config
    );
  } catch (e) {
    return { error: genericEvolutionError(e) };
  }

  const previewContent = caption || `[${messageType === "image" ? "imagem" : messageType === "video" ? "vídeo" : messageType === "audio" ? "áudio" : "documento"}]`;

  await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId,
        senderId: session.user.id,
        role: "assistant",
        direction: "outbound",
        type: messageType,
        status: "sent",
        content: previewContent,
        mediaBase64: base64,
        fileName: file.name,
      },
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessage: previewContent.length > 80 ? previewContent.slice(0, 79) + "…" : previewContent,
        lastMessageAt: new Date(),
        unreadCount: 0,
        aiEnabled: false, // agente humano assumiu
      },
    }),
  ]);

  await publishRealtime(session.user.workspaceId, {
    type: "message:new",
    conversationId,
    preview: previewContent,
  });

  revalidatePath(`/conversations/${conversationId}`);
  revalidatePath("/conversations");

  return { ok: true };
}

export async function markReadAction(conversationId: string): Promise<void> {
  const session = await auth();
  if (!session?.user) return;
  await prisma.conversation.updateMany({
    where: { id: conversationId, workspaceId: session.user.workspaceId },
    data: { unreadCount: 0 },
  });
  revalidatePath("/conversations");
}
