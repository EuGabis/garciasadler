import { prisma } from "@/lib/db";

export type ConversationListItem = {
  id: string;
  contactName: string;
  contactPhone: string;
  lastMessage: string | null;
  lastMessageAt: Date | null;
  unreadCount: number;
  status: string;
};

export async function listConversations(workspaceId: string): Promise<ConversationListItem[]> {
  const rows = await prisma.conversation.findMany({
    where: { workspaceId },
    orderBy: [{ lastMessageAt: { sort: "desc", nulls: "last" } }, { updatedAt: "desc" }],
    select: {
      id: true,
      status: true,
      unreadCount: true,
      lastMessage: true,
      lastMessageAt: true,
      contact: { select: { name: true, phone: true } },
    },
    take: 100,
  });

  return rows.map((r) => ({
    id: r.id,
    contactName: r.contact.name,
    contactPhone: r.contact.phone,
    lastMessage: r.lastMessage,
    lastMessageAt: r.lastMessageAt,
    unreadCount: r.unreadCount,
    status: r.status,
  }));
}

export async function getConversationWithMessages(workspaceId: string, conversationId: string) {
  const conv = await prisma.conversation.findFirst({
    where: { id: conversationId, workspaceId },
    select: {
      id: true,
      status: true,
      channel: true,
      unreadCount: true,
      contact: { select: { id: true, name: true, phone: true, avatar: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          role: true,
          direction: true,
          type: true,
          status: true,
          content: true,
          createdAt: true,
          sender: { select: { name: true } },
        },
        take: 200,
      },
    },
  });
  return conv;
}

export async function markConversationRead(conversationId: string): Promise<void> {
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { unreadCount: 0 },
  });
}
