import { prisma } from "@/lib/db";

export type AnalyticsPeriod = "today" | "7d" | "30d" | "90d";

export type Metrics = {
  period: { from: Date; to: Date; label: string };
  totals: {
    conversations: number;
    newConversations: number;
    resolvedConversations: number;
    inboundMessages: number;
    outboundMessages: number;
    avgFirstResponseSeconds: number | null;
    activeContacts: number;
  };
  byDay: Array<{ date: string; inbound: number; outbound: number }>;
  byAgent: Array<{ id: string; name: string; outboundCount: number }>;
  byColumn: Array<{ id: string; name: string; color: string; cardCount: number }>;
  byLabel: Array<{ id: string; name: string; color: string; count: number }>;
  byHour: Array<{ hour: number; count: number }>;
};

function rangeFor(period: AnalyticsPeriod): { from: Date; to: Date; label: string } {
  const now = new Date();
  const to = now;

  if (period === "today") {
    const from = new Date(now);
    from.setHours(0, 0, 0, 0);
    return { from, to, label: "Hoje" };
  }
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  const from = new Date(now);
  from.setDate(from.getDate() - days);
  from.setHours(0, 0, 0, 0);
  const label = period === "7d" ? "Últimos 7 dias" : period === "30d" ? "Últimos 30 dias" : "Últimos 90 dias";
  return { from, to, label };
}

function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildDaySpan(from: Date, to: Date): string[] {
  const out: string[] = [];
  const cur = new Date(from);
  cur.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);
  while (cur <= end) {
    out.push(dayKey(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

export async function getMetrics(workspaceId: string, period: AnalyticsPeriod): Promise<Metrics> {
  const range = rangeFor(period);

  const [
    newConversations,
    resolvedConversations,
    totalConversations,
    inboundMessages,
    outboundMessages,
    activeContacts,
    columns,
    labels,
  ] = await Promise.all([
    prisma.conversation.count({
      where: { workspaceId, createdAt: { gte: range.from, lte: range.to } },
    }),
    prisma.conversation.count({
      where: {
        workspaceId,
        status: "resolved",
        updatedAt: { gte: range.from, lte: range.to },
      },
    }),
    prisma.conversation.count({ where: { workspaceId } }),
    prisma.message.count({
      where: {
        direction: "inbound",
        createdAt: { gte: range.from, lte: range.to },
        conversation: { workspaceId },
      },
    }),
    prisma.message.count({
      where: {
        direction: "outbound",
        createdAt: { gte: range.from, lte: range.to },
        conversation: { workspaceId },
      },
    }),
    prisma.contact.count({
      where: {
        workspaceId,
        conversations: {
          some: { messages: { some: { createdAt: { gte: range.from, lte: range.to } } } },
        },
      },
    }),
    prisma.kanbanColumn.findMany({
      where: { workspaceId },
      orderBy: { order: "asc" },
      select: {
        id: true,
        name: true,
        color: true,
        _count: { select: { cards: true } },
      },
    }),
    prisma.label.findMany({
      where: { workspaceId },
      select: {
        id: true,
        name: true,
        color: true,
        _count: { select: { conversations: true } },
      },
    }),
  ]);

  // Mensagens do período (pra calcular byDay, byHour, byAgent)
  const messages = await prisma.message.findMany({
    where: {
      createdAt: { gte: range.from, lte: range.to },
      conversation: { workspaceId },
    },
    select: {
      direction: true,
      senderId: true,
      createdAt: true,
    },
  });

  const days = buildDaySpan(range.from, range.to);
  const byDayMap = new Map(days.map((d) => [d, { inbound: 0, outbound: 0 }]));
  const byHourCount = new Array(24).fill(0) as number[];
  const agentCounts = new Map<string, number>();

  for (const m of messages) {
    const k = dayKey(m.createdAt);
    const bucket = byDayMap.get(k);
    if (bucket) {
      if (m.direction === "inbound") bucket.inbound++;
      else if (m.direction === "outbound") bucket.outbound++;
    }
    byHourCount[m.createdAt.getHours()]++;
    if (m.direction === "outbound" && m.senderId) {
      agentCounts.set(m.senderId, (agentCounts.get(m.senderId) ?? 0) + 1);
    }
  }

  // Agentes envolvidos
  const agentIds = Array.from(agentCounts.keys());
  const agents = agentIds.length
    ? await prisma.user.findMany({
        where: { id: { in: agentIds } },
        select: { id: true, name: true },
      })
    : [];
  const byAgent = agents
    .map((a) => ({ id: a.id, name: a.name, outboundCount: agentCounts.get(a.id) ?? 0 }))
    .sort((a, b) => b.outboundCount - a.outboundCount)
    .slice(0, 10);

  // Tempo médio de primeira resposta (em conversas criadas no período)
  const newConvs = await prisma.conversation.findMany({
    where: { workspaceId, createdAt: { gte: range.from, lte: range.to } },
    select: {
      messages: {
        orderBy: { createdAt: "asc" },
        select: { direction: true, createdAt: true },
      },
    },
    take: 1000, // amostragem pra evitar queries gigantes
  });

  let respSum = 0;
  let respCount = 0;
  for (const c of newConvs) {
    const firstInbound = c.messages.find((m) => m.direction === "inbound");
    if (!firstInbound) continue;
    const firstOutbound = c.messages.find(
      (m) => m.direction === "outbound" && m.createdAt > firstInbound.createdAt
    );
    if (!firstOutbound) continue;
    respSum += (firstOutbound.createdAt.getTime() - firstInbound.createdAt.getTime()) / 1000;
    respCount++;
  }

  return {
    period: range,
    totals: {
      conversations: totalConversations,
      newConversations,
      resolvedConversations,
      inboundMessages,
      outboundMessages,
      avgFirstResponseSeconds: respCount > 0 ? Math.round(respSum / respCount) : null,
      activeContacts,
    },
    byDay: days.map((d) => ({
      date: d,
      inbound: byDayMap.get(d)?.inbound ?? 0,
      outbound: byDayMap.get(d)?.outbound ?? 0,
    })),
    byAgent,
    byColumn: columns.map((c) => ({
      id: c.id,
      name: c.name,
      color: c.color,
      cardCount: c._count.cards,
    })),
    byLabel: labels
      .map((l) => ({
        id: l.id,
        name: l.name,
        color: l.color,
        count: l._count.conversations,
      }))
      .filter((l) => l.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    byHour: byHourCount.map((count, hour) => ({ hour, count })),
  };
}

export function formatDuration(seconds: number | null): string {
  if (seconds === null) return "—";
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}
