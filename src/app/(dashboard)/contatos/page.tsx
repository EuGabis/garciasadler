import Link from "next/link";
import { Search, Plus, MessageSquare } from "lucide-react";
import { auth } from "@/auth";
import { listContacts } from "@/lib/contacts";
import { formatPhone, formatRelativeTime } from "@/lib/format";
import type { ContactStatus } from "@/generated/prisma/client";
import { PageHeader, SectionCard } from "@/components/ui";

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
    <div className="p-6 lg:p-10 max-w-6xl mx-auto text-stone-100">
      <PageHeader
        eyebrow="CRM"
        title="Contatos"
        description={`${contacts.length} ${contacts.length === 1 ? "contato cadastrado" : "contatos cadastrados"}`}
        actions={
          <Link
            href="/contatos/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition shadow-brand-glow"
          >
            <Plus className="h-3.5 w-3.5" />
            Novo contato
          </Link>
        }
      />

      <form className="mb-4 flex gap-2" method="get">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
          <input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Buscar por nome, telefone, e-mail ou interesse..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-white/10 bg-white/[0.03] text-stone-100 placeholder:text-stone-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/60"
          />
        </div>
        {params.status && <input type="hidden" name="status" value={params.status} />}
      </form>

      <div className="mb-4 flex gap-1.5 flex-wrap">
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
              className={`px-3 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-wider transition ${
                isActive
                  ? "bg-brand-500 text-white shadow-brand-glow"
                  : "bg-white/[0.04] text-stone-400 hover:bg-white/[0.08] hover:text-stone-200"
              }`}
            >
              {opt.label}
            </Link>
          );
        })}
      </div>

      <SectionCard noPadding>
        {contacts.length === 0 ? (
          <div className="p-12 text-center text-sm text-stone-400">
            Nenhum contato encontrado.
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            {contacts.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/contatos/${c.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.04] transition"
                >
                  <div className="h-10 w-10 shrink-0 rounded-full bg-brand-500/20 text-brand-300 text-sm font-semibold flex items-center justify-center ring-1 ring-brand-500/30">
                    {c.name[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate text-white">{c.name}</p>
                      {c.hasOpenConversation && (
                        <span
                          title="Conversa aberta"
                          className="inline-flex items-center gap-0.5 text-[10px] text-emerald-300"
                        >
                          <MessageSquare className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-400 truncate">
                      {formatPhone(c.phone)}
                      {c.email ? ` · ${c.email}` : ""}
                    </p>
                    {c.productInterest && (
                      <p className="text-xs text-stone-500 mt-0.5 truncate">
                        Interesse: {c.productInterest}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-stone-500 uppercase tracking-wider">
                      {c.lastMessageAt ? formatRelativeTime(c.lastMessageAt) : "—"}
                    </p>
                    {c.status !== "active" && (
                      <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] bg-white/[0.06] text-stone-300 capitalize ring-1 ring-white/10">
                        {c.status}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
