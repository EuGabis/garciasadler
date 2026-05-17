import Link from "next/link";
import {
  MessageSquare,
  Users,
  Tag,
  Columns3,
  TrendingUp,
  Zap,
  ArrowUpRight,
} from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NumberTicker, SpotlightCard, cn } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  const workspaceId = session!.user.workspaceId;

  const [conversations, contacts, labels, openConversations, columns, messagesToday] =
    await Promise.all([
      prisma.conversation.count({ where: { workspaceId } }),
      prisma.contact.count({ where: { workspaceId } }),
      prisma.label.count({ where: { workspaceId } }),
      prisma.conversation.count({ where: { workspaceId, status: "open" } }),
      prisma.kanbanColumn.count({ where: { workspaceId } }),
      prisma.message.count({
        where: {
          conversation: { workspaceId },
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
    ]);

  const firstName = session!.user.name?.split(" ")[0] ?? "agente";

  return (
    <div className="relative min-h-full text-stone-100">
      <div className="relative z-10 p-6 lg:p-10 max-w-7xl mx-auto">
        {/* Hero headline */}
        <header className="mb-12 animate-fade-in">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-brand-300 mb-3">
            {new Date().toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "2-digit",
              month: "long",
            })}
          </p>
          <h1 className="font-display text-5xl lg:text-7xl text-white tracking-tighter leading-none">
            Olá, {firstName}.
          </h1>
          <p className="mt-4 text-base text-stone-400 max-w-xl">
            Aqui está como sua loja está atendendo hoje.{" "}
            <Link
              href="/conversations"
              className="text-brand-400 hover:text-brand-300 inline-flex items-center gap-0.5 transition"
            >
              Abrir conversas <ArrowUpRight className="h-3 w-3" />
            </Link>
          </p>
        </header>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3 animate-fade-in">
          <KpiBig
            href="/conversations"
            label="Conversas abertas"
            value={openConversations}
            total={conversations}
            icon={MessageSquare}
            hint="aguardando atendimento"
            accent
          />
          <KpiCard
            href="/contatos"
            label="Contatos"
            value={contacts}
            icon={Users}
            color="emerald"
          />
          <KpiCard
            href="/configuracoes?tab=logs"
            label="Mensagens hoje"
            value={messagesToday}
            icon={TrendingUp}
            color="blue"
          />
          <KpiCard
            href="/etiquetas"
            label="Etiquetas"
            value={labels}
            icon={Tag}
            color="amber"
          />
        </div>

        {/* Linha 2: pipeline + próximos passos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 animate-fade-in">
          <SpotlightCard className="p-6 lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">
                Pipeline
              </span>
              <span className="h-8 w-8 rounded-xl bg-brand-500/10 text-brand-300 flex items-center justify-center">
                <Columns3 className="h-4 w-4" />
              </span>
            </div>
            <p className="text-4xl font-display text-white">
              <NumberTicker value={columns} />
            </p>
            <p className="text-xs text-stone-400 mt-1">colunas configuradas</p>
            <Link
              href="/pipeline"
              className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-brand-300 hover:text-brand-200 transition"
            >
              Ver pipeline <ArrowUpRight className="h-3 w-3" />
            </Link>
          </SpotlightCard>

          <SpotlightCard className="p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">
                Próximos passos
              </span>
              <span className="h-8 w-8 rounded-xl bg-brand-500/10 text-brand-300 flex items-center justify-center">
                <Zap className="h-4 w-4" />
              </span>
            </div>

            <ol className="space-y-3">
              {[
                {
                  label: "Configurar Evolution (URL/key/instância)",
                  href: "/configuracoes?tab=workspace",
                },
                {
                  label: "Criar etiquetas pra organizar conversas",
                  href: "/etiquetas",
                },
                {
                  label: "Ligar automação de primeira mensagem",
                  href: "/configuracoes?tab=automacoes",
                },
                {
                  label: "Ativar IA com tool use no estoque",
                  href: "/configuracoes?tab=ia",
                },
              ].map((s, i) => (
                <li key={i}>
                  <Link
                    href={s.href}
                    className="group flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-white/[0.03] transition"
                  >
                    <span className="shrink-0 h-6 w-6 rounded-md border border-white/10 text-[10px] font-bold text-stone-400 flex items-center justify-center group-hover:border-brand-400 group-hover:text-brand-300 transition">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm text-stone-300 group-hover:text-white transition">
                      {s.label}
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-stone-500 group-hover:text-brand-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition" />
                  </Link>
                </li>
              ))}
            </ol>
          </SpotlightCard>
        </div>

        {/* Footer sutil */}
        <p className="mt-12 text-center text-[10px] uppercase tracking-[0.3em] text-stone-600 animate-fade-in">
          Atendimento · Estoque · IA · Tempo real
        </p>
      </div>
    </div>
  );
}

function KpiBig({
  href,
  label,
  value,
  total,
  icon: Icon,
  hint,
  accent,
}: {
  href: string;
  label: string;
  value: number;
  total?: number;
  icon: React.ComponentType<{ className?: string }>;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <Link href={href} className="group lg:col-span-2 lg:row-span-1">
      <SpotlightCard
        className={cn(
          "h-full p-6 transition",
          accent && "shadow-brand-glow"
        )}
      >
        <div className="flex items-start justify-between mb-6">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">
            {label}
          </span>
          <span
            className={cn(
              "h-9 w-9 rounded-xl flex items-center justify-center",
              accent ? "bg-brand-500 text-white shadow-brand-glow" : "bg-white/5 text-stone-300"
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="font-display text-6xl text-white leading-none">
            <NumberTicker value={value} />
          </span>
          {total !== undefined && total !== value && (
            <span className="text-xl text-stone-500">/ {total}</span>
          )}
        </div>

        {hint && (
          <p className="mt-3 text-xs text-stone-400 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-pulse" />
            {hint}
          </p>
        )}
      </SpotlightCard>
    </Link>
  );
}

function KpiCard({
  href,
  label,
  value,
  icon: Icon,
  color,
}: {
  href: string;
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: "emerald" | "blue" | "amber" | "rose";
}) {
  const colorMap = {
    emerald: "bg-emerald-500/10 text-emerald-300",
    blue: "bg-blue-500/10 text-blue-300",
    amber: "bg-amber-500/10 text-amber-300",
    rose: "bg-rose-500/10 text-rose-300",
  };
  return (
    <Link href={href} className="group">
      <SpotlightCard className="h-full p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">
            {label}
          </span>
          <span className={cn("h-8 w-8 rounded-xl flex items-center justify-center", colorMap[color])}>
            <Icon className="h-3.5 w-3.5" />
          </span>
        </div>
        <p className="font-display text-4xl text-white leading-none">
          <NumberTicker value={value} />
        </p>
      </SpotlightCard>
    </Link>
  );
}
