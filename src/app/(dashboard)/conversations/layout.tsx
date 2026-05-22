import { auth } from "@/auth";
import { listConversations } from "@/lib/conversations";
import { ConversationsRealtime } from "./realtime";
import { FilterTabs } from "./filter-tabs";
import { InboxList } from "./inbox-list";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function ConversationsLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const workspaceId = session!.user.workspaceId;
  const cookieStore = await cookies();
  const mineOnly = cookieStore.get("conv_mine_only")?.value === "1";
  const conversations = await listConversations(workspaceId, {
    assignedToUserId: mineOnly ? session!.user.id : undefined,
  });

  return (
    <div className="flex h-screen bg-stone-50 dark:bg-stone-950">
      <ConversationsRealtime workspaceId={workspaceId} />

      <aside className="w-[340px] shrink-0 border-r border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-stone-900 flex flex-col">
        <header className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
              Conversas
            </h1>
            <span className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-md bg-stone-100 dark:bg-stone-800 text-[11px] font-medium tabular-nums text-stone-600 dark:text-stone-400">
              {conversations.length}
            </span>
          </div>
          <p className="text-[12px] text-stone-500 dark:text-stone-400 mt-0.5">
            {mineOnly ? "Atribuídas a você" : "Caixa de entrada"}
          </p>
        </header>

        <FilterTabs mineOnly={mineOnly} />

        <div className="flex-1 overflow-y-auto">
          <InboxList conversations={conversations} />
        </div>

        <footer className="px-5 py-2.5 border-t border-stone-200/80 dark:border-stone-800/80 flex items-center gap-2 text-[11px] text-stone-500">
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span>Tempo real</span>
        </footer>
      </aside>

      <section className="flex-1 min-w-0 bg-stone-50 dark:bg-stone-950">{children}</section>
    </div>
  );
}
