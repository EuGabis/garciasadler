import Link from "next/link";
import { Search, Plus, MessageSquare } from "lucide-react";
import { auth } from "@/auth";
import { listContacts } from "@/lib/contacts";
import { formatPhone, formatRelativeTime } from "@/lib/format";
import type { ContactStatus } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

type Search = { q?: string; status?: ContactStatus };

const STATUS_OPTIONS: Array<{ value: ContactStatus | "all"; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "active", label: "Ativos" },
  { value: "archived", label: "Arquivados" },
  { value: "blocked", label: "Bloqueados" },
];

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const params = await searchParams;
  const session = await auth();
  const contacts = await listContacts(session!.user.workspaceId, {
    query: params.q,
    status: params.status,
  });

  const activeStatus = params.status ?? "all";

  return (
    <div className="p-8 max-w-6xl">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contatos</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {contacts.length} {contacts.length === 1 ? "contato" : "contatos"}
          </p>
        </div>
        <Link
          href="/contatos/new"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition"
        >
          <Plus className="h-3.5 w-3.5" />
          Novo contato
        </Link>
      </header>

      <form className="mb-4 flex gap-2" method="get">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Buscar por nome, telefone, e-mail ou interesse..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        {params.status && <input type="hidden" name="status" value={params.status} />}
      </form>

      <div className="mb-4 flex gap-1 flex-wrap">
        {STATUS_OPTIONS.map((opt) => {
          const isActive = activeStatus === opt.value;
          const href =
            opt.value === "all"
              ? params.q
                ? `/contatos?q=${encodeURIComponent(params.q)}`
                : "/contatos"
              : `/contatos?status=${opt.value}${params.q ? `&q=${encodeURIComponent(params.q)}` : ""}`;
          return (
            <Link
              key={opt.value}
              href={href}
              className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                isActive
                  ? "bg-indigo-600 text-white"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              {opt.label}
            </Link>
          );
        })}
      </div>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
        {contacts.length === 0 ? (
          <div className="p-12 text-center text-sm text-zinc-500">
            Nenhum contato encontrado.
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {contacts.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/contatos/${c.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
                >
                  <div className="h-10 w-10 shrink-0 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-sm font-semibold flex items-center justify-center">
                    {c.name[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{c.name}</p>
                      {c.hasOpenConversation && (
                        <span
                          title="Conversa aberta"
                          className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 dark:text-emerald-400"
                        >
                          <MessageSquare className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 truncate">
                      {formatPhone(c.phone)}
                      {c.email ? ` · ${c.email}` : ""}
                    </p>
                    {c.productInterest && (
                      <p className="text-xs text-zinc-500 mt-0.5 truncate">
                        Interesse: {c.productInterest}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-zinc-500">
                      {c.lastMessageAt ? formatRelativeTime(c.lastMessageAt) : "—"}
                    </p>
                    {c.status !== "active" && (
                      <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 capitalize">
                        {c.status}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
