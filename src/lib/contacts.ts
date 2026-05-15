import { prisma } from "@/lib/db";
import type { ContactStatus, Prisma } from "@/generated/prisma/client";

export type ContactListItem = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  status: ContactStatus;
  source: string | null;
  productInterest: string | null;
  createdAt: Date;
  hasOpenConversation: boolean;
  lastMessageAt: Date | null;
};

export async function listContacts(
  workspaceId: string,
  options: { query?: string; status?: ContactStatus } = {}
): Promise<ContactListItem[]> {
  const q = options.query?.trim();
  const where: Prisma.ContactWhereInput = {
    workspaceId,
    ...(options.status ? { status: options.status } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { phone: { contains: q.replace(/\D/g, "") || q } },
            { email: { contains: q, mode: "insensitive" } },
            { productInterest: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const rows = await prisma.contact.findMany({
    where,
    orderBy: [{ updatedAt: "desc" }],
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      status: true,
      source: true,
      productInterest: true,
      createdAt: true,
      conversations: {
        select: { status: true, lastMessageAt: true },
        orderBy: { lastMessageAt: "desc" },
        take: 1,
      },
    },
    take: 200,
  });

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    phone: r.phone,
    email: r.email,
    status: r.status,
    source: r.source,
    productInterest: r.productInterest,
    createdAt: r.createdAt,
    hasOpenConversation: r.conversations.some(
      (c) => c.status === "open" || c.status === "pending"
    ),
    lastMessageAt: r.conversations[0]?.lastMessageAt ?? null,
  }));
}

export async function getContact(workspaceId: string, contactId: string) {
  return await prisma.contact.findFirst({
    where: { id: contactId, workspaceId },
    include: {
      conversations: {
        orderBy: { lastMessageAt: "desc" },
        select: {
          id: true,
          status: true,
          lastMessage: true,
          lastMessageAt: true,
          unreadCount: true,
        },
      },
    },
  });
}
