import Link from "next/link";
import { ChevronRight } from "lucide-react";
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
    <div className="p-6 lg:p-10 max-w-3xl mx-auto">
      <nav className="flex items-center gap-1.5 text-[12px] text-stone-500 mb-3">
        <Link
          href="/configuracoes?tab=automacoes"
          className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
        >
          Automações
        </Link>
        <ChevronRight className="h-3 w-3 text-stone-400" />
        <span className="text-stone-900 dark:text-stone-100 font-medium">Follow-ups</span>
      </nav>

      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
          Follow-ups
        </h1>
        <p className="mt-1.5 text-[13px] text-stone-500">
          Mensagens automáticas para reengajar conversas. Executam a cada 10 minutos via cron.
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
