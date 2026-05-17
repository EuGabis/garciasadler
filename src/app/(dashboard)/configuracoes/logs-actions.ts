"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { canManageTeam } from "@/lib/team";

export async function acknowledgeErrorAction(id: string): Promise<void> {
  const session = await auth();
  if (!session?.user || !canManageTeam(session.user.role)) return;
  await prisma.errorLog.updateMany({
    where: { id },
    data: { acknowledged: true },
  });
  revalidatePath("/configuracoes");
}

export async function acknowledgeAllAction(): Promise<void> {
  const session = await auth();
  if (!session?.user || !canManageTeam(session.user.role)) return;
  await prisma.errorLog.updateMany({
    where: {
      acknowledged: false,
      OR: [{ workspaceId: session.user.workspaceId }, { workspaceId: null }],
    },
    data: { acknowledged: true },
  });
  revalidatePath("/configuracoes");
}

export async function clearOldErrorsAction(): Promise<{ count: number }> {
  const session = await auth();
  if (!session?.user || !canManageTeam(session.user.role)) return { count: 0 };

  const threshold = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30d
  const r = await prisma.errorLog.deleteMany({
    where: {
      acknowledged: true,
      createdAt: { lt: threshold },
      OR: [{ workspaceId: session.user.workspaceId }, { workspaceId: null }],
    },
  });
  revalidatePath("/configuracoes");
  return { count: r.count };
}
