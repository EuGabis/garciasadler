import { prisma } from "@/lib/db";

export type KanbanCardItem = {
  id: string;
  conversationId: string;
  title: string | null;
  notes: string | null;
  order: number;
  contactName: string;
  contactPhone: string;
  lastMessage: string | null;
  unreadCount: number;
  labels: Array<{ id: string; name: string; color: string }>;
};

export type KanbanColumnItem = {
  id: string;
  name: string;
  color: string;
  order: number;
  wipLimit: number | null;
  cards: KanbanCardItem[];
};

export async function getBoard(workspaceId: string): Promise<KanbanColumnItem[]> {
  const columns = await prisma.kanbanColumn.findMany({
    where: { workspaceId },
    orderBy: { order: "asc" },
    select: {
      id: true,
      name: true,
      color: true,
      order: true,
      wipLimit: true,
      cards: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          conversationId: true,
          title: true,
          notes: true,
          order: true,
          conversation: {
            select: {
              lastMessage: true,
              unreadCount: true,
              contact: { select: { name: true, phone: true } },
              labels: {
                select: { label: { select: { id: true, name: true, color: true } } },
              },
            },
          },
        },
      },
    },
  });

  return columns.map((col) => ({
    id: col.id,
    name: col.name,
    color: col.color,
    order: col.order,
    wipLimit: col.wipLimit,
    cards: col.cards.map((c) => ({
      id: c.id,
      conversationId: c.conversationId,
      title: c.title,
      notes: c.notes,
      order: c.order,
      contactName: c.conversation.contact.name,
      contactPhone: c.conversation.contact.phone,
      lastMessage: c.conversation.lastMessage,
      unreadCount: c.conversation.unreadCount,
      labels: c.conversation.labels.map((l) => l.label),
    })),
  }));
}

export async function listConversationsForPipeline(workspaceId: string) {
  // Conversas que ainda não estão em nenhum card
  return await prisma.conversation.findMany({
    where: {
      workspaceId,
      kanbanCard: null,
      status: { in: ["open", "pending"] },
    },
    orderBy: { lastMessageAt: { sort: "desc", nulls: "last" } },
    select: {
      id: true,
      lastMessage: true,
      contact: { select: { name: true, phone: true } },
    },
    take: 100,
  });
}
