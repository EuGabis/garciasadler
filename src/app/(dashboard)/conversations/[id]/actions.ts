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
import type { MessageType } from "@/generated/prisma/client";

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

  const { evolutionUrl, evolutionKey, evolutionInstance } = conversation.workspace;
  if (!evolutionUrl || !evolutionKey || !evolutionInstance) {
    return { error: "Workspace não tem Evolution configurado." };
  }

  try {
    await sendWhatsAppText(conversation.contact.phone, text, {
      url: evolutionUrl,
      key: evolutionKey,
      instance: evolutionInstance,
    });
  } catch (e) {
    return { error: (e as Error).message };
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

  const { evolutionUrl, evolutionKey, evolutionInstance } = conversation.workspace;
  if (!evolutionUrl || !evolutionKey || !evolutionInstance) {
    return { error: "Workspace não tem Evolution configurado." };
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const base64 = buf.toString("base64");
  const mediaType = detectMediaType(file.type || "application/octet-stream");
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
      { url: evolutionUrl, key: evolutionKey, instance: evolutionInstance }
    );
  } catch (e) {
    return { error: (e as Error).message };
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
