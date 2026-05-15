import { auth } from "@/auth";
import { getBoard, listConversationsForPipeline } from "@/lib/kanban";
import { Board } from "./board";
import { ColumnManager } from "./column-manager";
import { SeedButton } from "./seed-button";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const session = await auth();
  const workspaceId = session!.user.workspaceId;
  const [columns, unassigned] = await Promise.all([
    getBoard(workspaceId),
    listConversationsForPipeline(workspaceId),
  ]);

  if (columns.length === 0) {
    return (
      <div className="p-8 max-w-3xl">
        <h1 className="text-2xl font-bold tracking-tight mb-2">Pipeline</h1>
        <p className="text-sm text-zinc-500 mb-8">Visualize o funil de atendimento em colunas.</p>
        <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 p-12 text-center">
          <p className="text-sm text-zinc-500 mb-4">Você ainda não tem colunas no pipeline.</p>
          <SeedButton />
          <p className="text-xs text-zinc-400 mt-3">Você pode editar as colunas depois.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col">
      <header className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pipeline</h1>
          <p className="mt-0.5 text-xs text-zinc-500">
            Arraste cards entre colunas. {unassigned.length} conversa(s) sem card.
          </p>
        </div>
        <ColumnManager
          columns={columns.map((c) => ({
            id: c.id,
            name: c.name,
            color: c.color,
            wipLimit: c.wipLimit,
            cardCount: c.cards.length,
          }))}
        />
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <Board columns={columns} unassigned={unassigned} />
      </div>
    </div>
  );
}
