import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

export type ErrorLevel = "warn" | "error" | "fatal";

export type ErrorLogRow = {
  id: string;
  level: string;
  scope: string;
  message: string;
  errorName: string | null;
  stack: string | null;
  context: unknown;
  requestId: string | null;
  url: string | null;
  ip: string | null;
  acknowledged: boolean;
  createdAt: Date;
};

export async function listErrors(
  workspaceId: string | null,
  filters: { level?: ErrorLevel; scope?: string; onlyUnack?: boolean; limit?: number } = {}
): Promise<ErrorLogRow[]> {
  const where: Prisma.ErrorLogWhereInput = {};
  // Erros sem workspaceId (globais) também aparecem pro workspace.
  if (workspaceId) where.OR = [{ workspaceId }, { workspaceId: null }];
  if (filters.level) where.level = filters.level;
  if (filters.scope) where.scope = { contains: filters.scope };
  if (filters.onlyUnack) where.acknowledged = false;

  return await prisma.errorLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: filters.limit ?? 100,
    select: {
      id: true,
      level: true,
      scope: true,
      message: true,
      errorName: true,
      stack: true,
      context: true,
      requestId: true,
      url: true,
      ip: true,
      acknowledged: true,
      createdAt: true,
    },
  });
}

export async function countUnacknowledged(workspaceId: string | null): Promise<number> {
  return await prisma.errorLog.count({
    where: {
      acknowledged: false,
      ...(workspaceId ? { OR: [{ workspaceId }, { workspaceId: null }] } : {}),
    },
  });
}

export async function listScopes(workspaceId: string | null): Promise<string[]> {
  const rows = await prisma.errorLog.findMany({
    where: workspaceId ? { OR: [{ workspaceId }, { workspaceId: null }] } : {},
    distinct: ["scope"],
    select: { scope: true },
    orderBy: { scope: "asc" },
    take: 100,
  });
  return rows.map((r) => r.scope);
}
