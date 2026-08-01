import { prisma } from "@/lib/db";

export type ConversationLabelInfo = { id: string; name: string; color: string };
export type AssignedUserInfo = { id: string; name: string };

export type ConversationListItem = {
  id: string;
  contactName: string;
  contactPhone: string;
  lastMessage: string | null;
  lastMessageAt: Date | null;
  unreadCount: number;
  status: string;
  labels: ConversationLabelInfo[];
  assignedTo: AssignedUserInfo[];
};

export type ListConversationsOptions = {
  includeArchived?: boolean;
  assignedToUserId?: string;
  offset?: number;
  limit?: number;
};

export type ListConversationsResult = {
  items: ConversationListItem[];
  hasMore: boolean;
};

const DEFAULT_PAGE_SIZE = 50;

export async function listConversations(
  workspaceId: string,
  options: ListConversationsOptions = {}
): Promise<ListConversationsResult> {
  const offset = Math.max(0, options.offset ?? 0);
  const limit = Math.max(1, Math.min(200, options.limit ?? DEFAULT_PAGE_SIZE));
  // Pega limit+1 pra saber se tem mais alem do batch atual sem precisar
  // de count separado (que dobraria queries).
  const rows = await prisma.conversation.findMany({
    where: {
      workspaceId,
      ...(options.includeArchived ? {} : { status: { in: ["open", "pending"] } }),
      ...(options.assignedToUserId
        ? { assignments: { some: { userId: options.assignedToUserId } } }
        : {}),
    },
    orderBy: [{ lastMessageAt: { sort: "desc", nulls: "last" } }, { updatedAt: "desc" }],
    select: {
      id: true,
      status: true,
      unreadCount: true,
      lastMessage: true,
      lastMessageAt: true,
      contact: { select: { name: true, phone: true } },
      labels: { select: { label: { select: { id: true, name: true, color: true } } } },
      assignments: { select: { user: { select: { id: true, name: true } } } },
    },
    skip: offset,
    take: limit + 1,
  });

  const hasMore = rows.length > limit;
  const trimmed = hasMore ? rows.slice(0, limit) : rows;

  return {
    items: trimmed.map((r) => ({
      id: r.id,
      contactName: r.contact.name,
      contactPhone: r.contact.phone,
      lastMessage: r.lastMessage,
      lastMessageAt: r.lastMessageAt,
      unreadCount: r.unreadCount,
      status: r.status,
      labels: r.labels.map((l) => l.label),
      assignedTo: r.assignments.map((a) => a.user),
    })),
    hasMore,
  };
}

export async function getConversationWithMessages(workspaceId: string, conversationId: string) {
  const conv = await prisma.conversation.findFirst({
    where: { id: conversationId, workspaceId },
    select: {
      id: true,
      status: true,
      channel: true,
      unreadCount: true,
      aiEnabled: true,
      createdAt: true,
      contact: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          avatar: true,
          notes: true,
          productInterest: true,
          source: true,
          status: true,
          createdAt: true,
        },
      },
      labels: { select: { label: { select: { id: true, name: true, color: true } } } },
      assignments: { select: { user: { select: { id: true, name: true } } } },
      messages: {
        // S2-07: NÃO selecionamos mediaBase64 (pode ser MB por mensagem).
        // Mídia é servida sob demanda por /api/messages/[id]/media.
        // 'desc' + reverse() na UI: pega as 50 mais recentes.
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          role: true,
          direction: true,
          type: true,
          status: true,
          content: true,
          mediaUrl: true,
          fileName: true,
          transcript: true,
          createdAt: true,
          sender: { select: { name: true } },
        },
        take: 50,
      },
    },
  });
  if (!conv) return null;
  // Reverte pra ordem cronológica (asc) pra UI exibir corretamente.
  return { ...conv, messages: [...conv.messages].reverse() };
}

export async function markConversationRead(
  workspaceId: string,
  conversationId: string
): Promise<void> {
  // updateMany pra que falhe silenciosamente em IDOR (não vaza existência)
  await prisma.conversation.updateMany({
    where: { id: conversationId, workspaceId },
    data: { unreadCount: 0 },
  });
}
