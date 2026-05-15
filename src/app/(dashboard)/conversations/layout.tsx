import Link from "next/link";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { listConversations } from "@/lib/conversations";
import { formatRelativeTime } from "@/lib/format";
import { MessageSquare } from "lucide-react";
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
    <div className="flex h-screen">
      <ConversationsRealtime workspaceId={workspaceId} />
      <aside className="w-80 shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col">
        <header className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
          <h1 className="text-base font-semibold">Conversas</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {conversations.length} {mineOnly ? "atribuída(s) a você" : "no total"}
          </p>
        </header>
        <FilterTabs mineOnly={mineOnly} />

        <ul className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
          {conversations.length === 0 ? (
            <li className="p-8 text-center text-sm text-zinc-500">
              Nenhuma conversa ainda.
              <br />
              Aguardando primeira mensagem.
            </li>
          ) : (
            conversations.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/conversations/${c.id}`}
                  className="block px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-sm font-semibold flex items-center justify-center">
                      {c.contactName?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium truncate">{c.contactName}</p>
                        <span className="text-xs text-zinc-500 shrink-0">
                          {formatRelativeTime(c.lastMessageAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p className="text-xs text-zinc-500 truncate">
                          {c.lastMessage ?? "—"}
                        </p>
                        {c.unreadCount > 0 && (
                          <span className="shrink-0 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-indigo-600 text-white text-[10px] font-semibold">
                            {c.unreadCount}
                          </span>
                        )}
                      </div>
                      {(c.labels.length > 0 || c.assignedTo.length > 0) && (
                        <div className="mt-1 flex flex-wrap items-center gap-1">
                          {c.assignedTo.slice(0, 3).map((u) => (
                            <span
                              key={u.id}
                              title={u.name}
                              className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-[8px] font-bold ring-1 ring-white dark:ring-zinc-900"
                            >
                              {u.name[0]?.toUpperCase() ?? "?"}
                            </span>
                          ))}
                          {c.labels.slice(0, 3).map((l) => (
                            <span
                              key={l.id}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium"
                              style={{
                                backgroundColor: `${l.color}22`,
                                color: l.color,
                              }}
                            >
                              {l.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            ))
          )}
        </ul>

        <footer className="px-4 py-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-1.5 text-xs text-zinc-500">
          <MessageSquare className="h-3 w-3" />
          <span>Mensagens em tempo real</span>
          <span className="ml-auto inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </footer>
      </aside>

      <section className="flex-1 min-w-0 bg-zinc-50 dark:bg-zinc-950">{children}</section>
    </div>
  );
}
