import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { FollowUpList } from "./followup-list";
import { PageHeader } from "@/components/ui";

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
    <div className="p-6 lg:p-10 max-w-3xl mx-auto text-stone-100">
      <nav className="text-[10px] text-stone-500 mb-3 flex gap-2 uppercase tracking-wider">
        <Link
          href="/configuracoes?tab=automacoes"
          className="hover:text-brand-300 transition"
        >
          Automações
        </Link>
        <span>·</span>
        <span className="text-brand-300 font-medium">Follow-ups</span>
      </nav>
      <PageHeader
        eyebrow="Reengajamento"
        title="Follow-ups"
        description="Mensagens automáticas pra reengajar conversas. Executam a cada 10 minutos via cron."
      />

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
