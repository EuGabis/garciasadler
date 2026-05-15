import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { FollowUpList } from "./followup-list";

export const dynamic = "force-dynamic";

export default async function FollowUpsPage() {
  const session = await auth();
  const workspaceId = session!.user.workspaceId;

  const [followUps, team, columns] = await Promise.all([
    prisma.followUp.findMany({
      where: { workspaceId },
      orderBy: [{ enabled: "desc" }, { createdAt: "asc" }],
      include: { _count: { select: { logs: true } } },
    }),
    prisma.user.findMany({
      where: { workspaceId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.kanbanColumn.findMany({
      where: { workspaceId },
      select: { id: true, name: true },
      orderBy: { order: "asc" },
    }),
  ]);

  return (
    <div className="p-8 max-w-3xl">
      <header className="mb-6">
        <nav className="text-xs text-zinc-500 mb-2 flex gap-3">
          <Link href="/automacoes" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            Automações
          </Link>
          <span>·</span>
          <span className="text-zinc-900 dark:text-zinc-100 font-medium">Follow-ups</span>
        </nav>
        <h1 className="text-2xl font-bold tracking-tight">Follow-ups</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Mensagens automáticas pra reengajar conversas. Executam a cada 10 minutos via cron.
        </p>
      </header>

      <FollowUpList
        followUps={followUps.map((f) => ({
          id: f.id,
          name: f.name,
          enabled: f.enabled,
          triggerType: f.triggerType as "inactivity" | "column_entry",
          inactivityHours: f.inactivityHours,
          columnId: f.columnId,
          message: f.message,
          transferToUserId: f.transferToUserId,
          maxTimes: f.maxTimes,
          totalExecutions: f._count.logs,
        }))}
        team={team}
        columns={columns}
      />
    </div>
  );
}
