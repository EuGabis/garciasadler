import Link from "next/link";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { listConversations } from "@/lib/conversations";
import { formatRelativeTime } from "@/lib/format";
import { Inbox } from "lucide-react";
import { ConversationsRealtime } from "./realtime";
import { FilterTabs } from "./filter-tabs";

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

        <ul className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <li className="px-6 py-16 text-center">
              <div className="mx-auto h-10 w-10 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-3">
                <Inbox className="h-4 w-4 text-stone-400" />
              </div>
              <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
                Nenhuma conversa
              </p>
              <p className="text-xs text-stone-500 mt-1">
                Aguardando primeira mensagem
              </p>
            </li>
          ) : (
            conversations.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/conversations/${c.id}`}
                  className="block px-5 py-3.5 hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors border-b border-stone-100/80 dark:border-stone-800/40 last:border-b-0"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-sm font-semibold flex items-center justify-center">
                      {c.contactName?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p className="text-[13px] font-semibold truncate text-stone-900 dark:text-stone-50">
                          {c.contactName}
                        </p>
                        <span className="text-[11px] tabular-nums text-stone-500 shrink-0">
                          {formatRelativeTime(c.lastMessageAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-[12px] truncate ${c.unreadCount > 0 ? "text-stone-900 dark:text-stone-200 font-medium" : "text-stone-500 dark:text-stone-400"}`}>
                          {c.lastMessage ?? "—"}
                        </p>
                        {c.unreadCount > 0 && (
                          <span className="shrink-0 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-brand-600 text-white text-[10px] font-semibold tabular-nums">
                            {c.unreadCount}
                          </span>
                        )}
                      </div>
                      {(c.labels.length > 0 || c.assignedTo.length > 0) && (
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          {c.assignedTo.slice(0, 3).map((u) => (
                            <span
                              key={u.id}
                              title={u.name}
                              className="inline-flex items-center justify-center h-[18px] w-[18px] rounded-full bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-200 text-[9px] font-bold ring-2 ring-white dark:ring-stone-900"
                            >
                              {u.name[0]?.toUpperCase() ?? "?"}
                            </span>
                          ))}
                          {c.labels.slice(0, 2).map((l) => (
                            <span
                              key={l.id}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium"
                              style={{
                                backgroundColor: `${l.color}1a`,
                                color: l.color,
                              }}
                            >
                              {l.name}
                            </span>
                          ))}
                          {c.labels.length > 2 && (
                            <span className="text-[10px] text-stone-400">
                              +{c.labels.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            ))
          )}
        </ul>

        <footer className="px-5 py-2.5 border-t border-stone-200/80 dark:border-stone-800/80 flex items-center gap-2 text-[11px] text-stone-500">
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span>Tempo real</span>
        </footer>
      </aside>

      <section className="flex-1 min-w-0 bg-stone-50 dark:bg-stone-950">{children}</section>
    </div>
  );
}
