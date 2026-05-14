"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { sendWhatsAppText } from "@/lib/evolution";
import { publishRealtime } from "@/lib/pusher-server";

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

export async function markReadAction(conversationId: string): Promise<void> {
  const session = await auth();
  if (!session?.user) return;
  await prisma.conversation.updateMany({
    where: { id: conversationId, workspaceId: session.user.workspaceId },
    data: { unreadCount: 0 },
  });
  revalidatePath("/conversations");
}
