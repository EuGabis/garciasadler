import Link from "next/link";
import { Search, Plus, MessageSquare } from "lucide-react";
import { auth } from "@/auth";
import { listContacts } from "@/lib/contacts";
import { formatPhone, formatRelativeTime } from "@/lib/format";
import { avatarColor, avatarInitial } from "@/lib/avatar-color";
import type { ContactStatus } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

type Search = { q?: string; status?: ContactStatus };

const STATUS_OPTIONS: Array<{ value: ContactStatus | "all"; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "active", label: "Ativos" },
  { value: "archived", label: "Arquivados" },
  { value: "blocked", label: "Bloqueados" },
];

const STATUS_BADGE: Record<ContactStatus, string> = {
  active:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 ring-emerald-200/60 dark:ring-emerald-500/20",
  archived:
    "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400 ring-stone-200/60 dark:ring-stone-700",
  blocked:
    "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 ring-red-200/60 dark:ring-red-500/20",
};

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
    <div className="p-6 lg:p-10 max-w-6xl mx-auto">
      {/* Header */}
      <header className="flex items-end justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
            Contatos
          </h1>
          <p className="mt-1 text-[13px] text-stone-500">
            {contacts.length} {contacts.length === 1 ? "contato cadastrado" : "contatos cadastrados"}
          </p>
        </div>
        <Link
          href="/contatos/new"
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-[13px] font-medium shadow-sm transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Novo contato
        </Link>
      </header>

      {/* Search + filters */}
      <div className="mb-5 flex flex-col sm:flex-row gap-3">
        <form className="flex-1" method="get">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
            <input
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Buscar por nome, telefone, e-mail ou interesse…"
              className="w-full pl-9 pr-3 h-9 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-[13px] text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
            />
          </div>
          {params.status && <input type="hidden" name="status" value={params.status} />}
        </form>

        <div className="inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-stone-100 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-800/80">
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
                className={`px-3 h-8 inline-flex items-center rounded-md text-[12px] font-medium transition-colors ${
                  isActive
                    ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-50 shadow-sm ring-1 ring-stone-200/60 dark:ring-stone-700/60"
                    : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                }`}
              >
                {opt.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div className="rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-stone-900 overflow-hidden">
        {contacts.length === 0 ? (
          <div className="p-16 text-center">
            <div className="mx-auto h-10 w-10 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-3">
              <Search className="h-4 w-4 text-stone-400" />
            </div>
            <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
              Nenhum contato encontrado
            </p>
            <p className="text-xs text-stone-500 mt-1">
              {params.q ? "Tente outro termo de busca" : "Cadastre seu primeiro contato"}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-stone-100 dark:divide-stone-800/60">
            {contacts.map((c) => {
              const color = avatarColor(c.name);
              return (
                <li key={c.id}>
                  <Link
                    href={`/contatos/${c.id}`}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors"
                  >
                    <div
                      className={`h-10 w-10 shrink-0 rounded-full ring-1 text-sm font-semibold flex items-center justify-center ${color.bg} ${color.text} ${color.ring}`}
                    >
                      {avatarInitial(c.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[13.5px] font-semibold truncate tracking-tight text-stone-900 dark:text-stone-50">
                          {c.name}
                        </p>
                        {c.hasOpenConversation && (
                          <span
                            title="Conversa aberta"
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-medium ring-1 ring-emerald-200/60 dark:ring-emerald-500/20"
                          >
                            <MessageSquare className="h-2.5 w-2.5" />
                            Em conversa
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-stone-500 truncate tabular-nums">
                        {formatPhone(c.phone)}
                        {c.email ? ` · ${c.email}` : ""}
                      </p>
                      {c.productInterest && (
                        <p className="text-[11.5px] text-stone-400 mt-0.5 truncate">
                          Interesse: <span className="text-stone-600 dark:text-stone-400">{c.productInterest}</span>
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0 flex flex-col items-end gap-1">
                      <p className="text-[11.5px] tabular-nums text-stone-500">
                        {c.lastMessageAt ? formatRelativeTime(c.lastMessageAt) : "—"}
                      </p>
                      {c.status !== "active" && (
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wider ring-1 ${STATUS_BADGE[c.status]}`}
                        >
                          {c.status}
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
