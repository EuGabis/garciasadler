import Link from "next/link";
import { Clock, ArrowUpRight } from "lucide-react";
import { prisma } from "@/lib/db";
import { AutomationList } from "../automacoes/automation-list";

export async function AutomacoesTab({ workspaceId }: { workspaceId: string }) {
  const [automations, team, columns] = await Promise.all([
    prisma.automation.findMany({
      where: { workspaceId },
      orderBy: [{ enabled: "desc" }, { createdAt: "asc" }],
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
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <p className="text-[13px] text-stone-500 max-w-2xl">
          Disparam ao receber mensagem. Encadeiam ações: atribuição, etiqueta, pipeline, resposta.
        </p>
        <Link
          href="/automacoes/followups"
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-[12.5px] font-medium text-stone-700 dark:text-stone-300 transition-colors shrink-0"
        >
          <Clock className="h-3.5 w-3.5" />
          Follow-ups
          <ArrowUpRight className="h-3 w-3 text-stone-400" />
        </Link>
      </div>

      <AutomationList
        automations={automations.map((a) => ({
          id: a.id,
          name: a.name,
          enabled: a.enabled,
          triggerType: a.triggerType as "first_message" | "keyword",
          keywords: a.keywords ?? [],
          assignUserId: a.assignUserId,
          pipelineColumnId: a.pipelineColumnId,
          addLabelName: a.addLabelName,
          replyMessage: a.replyMessage,
        }))}
        team={team}
        columns={columns}
      />
    </div>
  );
}
