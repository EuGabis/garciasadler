import { auth } from "@/auth";
import { Columns3 } from "lucide-react";
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
      <div className="p-4 md:p-6 lg:p-10 max-w-3xl mx-auto">
        <header className="mb-7">
          <p className="spec-label inline-flex items-center gap-2 text-stone-500 mb-2">
            <span aria-hidden className="h-3 w-[3px] rounded-full rule-brand" />
            Funil de atendimento
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
            Pipeline
          </h1>
          <p className="mt-1.5 text-[13px] text-stone-500">
            Visualize o funil de atendimento em colunas.
          </p>
        </header>

        <div className="rounded-xl border border-dashed border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 p-12 text-center">
          <div className="mx-auto h-11 w-11 rounded-full bg-brand-50 dark:bg-brand-500/15 ring-1 ring-brand-600/15 dark:ring-brand-400/20 flex items-center justify-center mb-4">
            <Columns3 className="h-5 w-5 text-brand-600 dark:text-brand-400" />
          </div>
          <p className="text-[13.5px] font-medium text-stone-700 dark:text-stone-300 mb-1">
            Pipeline vazio
          </p>
          <p className="text-[12px] text-stone-500 mb-5">
            Você ainda não tem colunas configuradas.
          </p>
          <SeedButton />
          <p className="text-[11px] text-stone-400 mt-3">
            Você pode editar as colunas depois.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 h-full flex flex-col max-w-[1400px] mx-auto">
      <header className="flex items-end justify-between gap-4 mb-5 shrink-0 flex-wrap">
        <div>
          <p className="spec-label inline-flex items-center gap-2 text-stone-500 mb-2">
            <span aria-hidden className="h-3 w-[3px] rounded-full rule-brand" />
            Funil de atendimento
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
            Pipeline
          </h1>
          <p className="mt-1 text-[13px] text-stone-500">
            Arraste cards entre colunas.{" "}
            {unassigned.length > 0 && (
              <span className="text-stone-700 dark:text-stone-300 font-medium">
                {unassigned.length} conversa{unassigned.length === 1 ? "" : "s"} sem card
              </span>
            )}
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
