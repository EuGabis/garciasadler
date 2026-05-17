import { auth } from "@/auth";
import { getBoard, listConversationsForPipeline } from "@/lib/kanban";
import { Board } from "./board";
import { ColumnManager } from "./column-manager";
import { SeedButton } from "./seed-button";
import { PageHeader } from "@/components/ui";

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
      <div className="p-6 lg:p-10 max-w-3xl mx-auto text-stone-100">
        <PageHeader
          eyebrow="Funil"
          title="Pipeline"
          description="Visualize o funil de atendimento em colunas."
        />
        <div className="rounded-2xl glass-light border-dashed border-2 border-white/10 p-12 text-center">
          <p className="text-sm text-stone-400 mb-4">Você ainda não tem colunas no pipeline.</p>
          <SeedButton />
          <p className="text-[10px] uppercase tracking-wider text-stone-500 mt-3">
            Você pode editar as colunas depois.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 h-full flex flex-col text-stone-100">
      <PageHeader
        eyebrow="Funil"
        title="Pipeline"
        description={`Arraste cards entre colunas. ${unassigned.length} conversa(s) sem card.`}
        actions={
          <ColumnManager
            columns={columns.map((c) => ({
              id: c.id,
              name: c.name,
              color: c.color,
              wipLimit: c.wipLimit,
              cardCount: c.cards.length,
            }))}
          />
        }
      />

      <div className="flex-1 min-h-0 overflow-y-auto -mx-2 px-2">
        <Board columns={columns} unassigned={unassigned} />
      </div>
    </div>
  );
}
