"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

// ---------- Colunas ----------

const colCreateSchema = z.object({
  name: z.string().min(1).max(40),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  wipLimit: z.coerce.number().int().min(0).max(999).optional(),
});

const colUpdateSchema = colCreateSchema.extend({ id: z.string().min(1) });

export type ColumnState = { error?: string; ok?: boolean } | null;

export async function createColumnAction(
  _prev: ColumnState,
  formData: FormData
): Promise<ColumnState> {
  const session = await auth();
  if (!session?.user) return { error: "Não autenticado." };

  const parsed = colCreateSchema.safeParse({
    name: formData.get("name"),
    color: formData.get("color"),
    wipLimit: formData.get("wipLimit") || undefined,
  });
  if (!parsed.success) return { error: "Dados inválidos." };

  const maxOrder = await prisma.kanbanColumn.aggregate({
    where: { workspaceId: session.user.workspaceId },
    _max: { order: true },
  });

  await prisma.kanbanColumn.create({
    data: {
      workspaceId: session.user.workspaceId,
      name: parsed.data.name,
      color: parsed.data.color,
      order: (maxOrder._max.order ?? -1) + 1,
      wipLimit: parsed.data.wipLimit && parsed.data.wipLimit > 0 ? parsed.data.wipLimit : null,
    },
  });

  revalidatePath("/pipeline");
  return { ok: true };
}

export async function updateColumnAction(
  _prev: ColumnState,
  formData: FormData
): Promise<ColumnState> {
  const session = await auth();
  if (!session?.user) return { error: "Não autenticado." };

  const parsed = colUpdateSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    color: formData.get("color"),
    wipLimit: formData.get("wipLimit") || undefined,
  });
  if (!parsed.success) return { error: "Dados inválidos." };

  const column = await prisma.kanbanColumn.findFirst({
    where: { id: parsed.data.id, workspaceId: session.user.workspaceId },
  });
  if (!column) return { error: "Coluna não encontrada." };

  await prisma.kanbanColumn.update({
    where: { id: parsed.data.id },
    data: {
      name: parsed.data.name,
      color: parsed.data.color,
      wipLimit: parsed.data.wipLimit && parsed.data.wipLimit > 0 ? parsed.data.wipLimit : null,
    },
  });

  revalidatePath("/pipeline");
  return { ok: true };
}

export async function deleteColumnAction(columnId: string): Promise<void> {
  const session = await auth();
  if (!session?.user) return;
  await prisma.kanbanColumn.deleteMany({
    where: { id: columnId, workspaceId: session.user.workspaceId },
  });
  revalidatePath("/pipeline");
}

// ---------- Cards ----------

export async function addCardAction(
  columnId: string,
  conversationId: string
): Promise<{ error?: string; ok?: boolean }> {
  const session = await auth();
  if (!session?.user) return { error: "Não autenticado." };

  const [column, conversation] = await Promise.all([
    prisma.kanbanColumn.findFirst({
      where: { id: columnId, workspaceId: session.user.workspaceId },
      select: { id: true, wipLimit: true, _count: { select: { cards: true } } },
    }),
    prisma.conversation.findFirst({
      where: { id: conversationId, workspaceId: session.user.workspaceId },
      select: { id: true, kanbanCard: { select: { id: true } } },
    }),
  ]);
  if (!column) return { error: "Coluna não encontrada." };
  if (!conversation) return { error: "Conversa não encontrada." };
  if (conversation.kanbanCard) return { error: "Conversa já está em um card." };

  if (column.wipLimit && column._count.cards >= column.wipLimit) {
    return { error: "Limite da coluna atingido." };
  }

  const maxOrder = await prisma.kanbanCard.aggregate({
    where: { columnId: column.id },
    _max: { order: true },
  });

  await prisma.kanbanCard.create({
    data: {
      columnId: column.id,
      conversationId: conversation.id,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  revalidatePath("/pipeline");
  return { ok: true };
}

export async function moveCardAction(
  cardId: string,
  targetColumnId: string,
  targetIndex: number
): Promise<{ error?: string; ok?: boolean }> {
  const session = await auth();
  if (!session?.user) return { error: "Não autenticado." };

  const card = await prisma.kanbanCard.findFirst({
    where: { id: cardId },
    include: { column: { select: { workspaceId: true, id: true } } },
  });
  if (!card || card.column.workspaceId !== session.user.workspaceId) {
    return { error: "Card não encontrado." };
  }

  const target = await prisma.kanbanColumn.findFirst({
    where: { id: targetColumnId, workspaceId: session.user.workspaceId },
    select: { id: true, wipLimit: true, _count: { select: { cards: true } } },
  });
  if (!target) return { error: "Coluna destino não encontrada." };

  const movingBetweenCols = card.column.id !== target.id;
  if (movingBetweenCols && target.wipLimit && target._count.cards >= target.wipLimit) {
    return { error: "Limite da coluna destino atingido." };
  }

  // Reordena: trazemos cards atuais da coluna destino, removemos o card (se já estava lá), inserimos na posição e reescrevemos order
  const targetCards = await prisma.kanbanCard.findMany({
    where: { columnId: target.id },
    orderBy: { order: "asc" },
    select: { id: true },
  });

  const filtered = targetCards.filter((c) => c.id !== cardId).map((c) => c.id);
  const insertAt = Math.max(0, Math.min(targetIndex, filtered.length));
  filtered.splice(insertAt, 0, cardId);

  await prisma.$transaction([
    prisma.kanbanCard.update({
      where: { id: cardId },
      data: { columnId: target.id },
    }),
    ...filtered.map((id, idx) =>
      prisma.kanbanCard.update({
        where: { id },
        data: { order: idx },
      })
    ),
  ]);

  revalidatePath("/pipeline");
  return { ok: true };
}

export async function removeCardAction(cardId: string): Promise<void> {
  const session = await auth();
  if (!session?.user) return;
  const card = await prisma.kanbanCard.findFirst({
    where: { id: cardId },
    include: { column: { select: { workspaceId: true } } },
  });
  if (!card || card.column.workspaceId !== session.user.workspaceId) return;
  await prisma.kanbanCard.delete({ where: { id: cardId } });
  revalidatePath("/pipeline");
}

// ---------- Seed de colunas padrão ----------

export async function seedDefaultColumnsAction(): Promise<{ ok?: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user) return { error: "Não autenticado." };

  const existing = await prisma.kanbanColumn.count({
    where: { workspaceId: session.user.workspaceId },
  });
  if (existing > 0) return { error: "Já existem colunas." };

  await prisma.kanbanColumn.createMany({
    data: [
      { workspaceId: session.user.workspaceId, name: "Novo", color: "#6366f1", order: 0 },
      { workspaceId: session.user.workspaceId, name: "Em atendimento", color: "#f59e0b", order: 1 },
      { workspaceId: session.user.workspaceId, name: "Negociação", color: "#3b82f6", order: 2 },
      { workspaceId: session.user.workspaceId, name: "Fechado", color: "#10b981", order: 3 },
      { workspaceId: session.user.workspaceId, name: "Perdido", color: "#ef4444", order: 4 },
    ],
  });

  revalidatePath("/pipeline");
  return { ok: true };
}
