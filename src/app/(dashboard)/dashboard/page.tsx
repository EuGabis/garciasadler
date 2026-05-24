import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import {
  MessageSquare,
  Users,
  Tag,
  Columns3,
  ArrowUpRight,
  Settings,
  Zap,
  Sparkles,
  UserCog,
} from "lucide-react";

export const dynamic = "force-dynamic";

function greeting(hour: number): string {
  if (hour < 6) return "Boa madrugada";
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export default async function DashboardPage() {
  const session = await auth();
  const workspaceId = session!.user.workspaceId;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    totalConversations,
    contactsCount,
    labelsCount,
    openConversations,
    columnsCount,
    messagesToday,
  ] = await Promise.all([
    prisma.conversation.count({ where: { workspaceId } }),
    prisma.contact.count({ where: { workspaceId } }),
    prisma.label.count({ where: { workspaceId } }),
    prisma.conversation.count({ where: { workspaceId, status: "open" } }),
    prisma.kanbanColumn.count({ where: { workspaceId } }),
    prisma.message.count({
      where: {
        conversation: { workspaceId },
        createdAt: { gte: startOfDay },
      },
    }),
  ]);

  const firstName = session!.user.name?.split(" ")[0] ?? "";
  const now = new Date();
  const hello = greeting(now.getHours());

  const dateLabel = now.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  const kpis = [
    {
      label: "Conversas abertas",
      value: openConversations,
      total: totalConversations,
      href: "/conversations",
      icon: MessageSquare,
      hint: openConversations > 0 ? "aguardando atendimento" : "tudo em dia",
      accent: true,
    },
    {
      label: "Contatos",
      value: contactsCount,
      href: "/contatos",
      icon: Users,
      hint: "cadastrados no workspace",
    },
    {
      label: "Mensagens hoje",
      value: messagesToday,
      href: "/conversations",
      icon: Sparkles,
      hint: "trocadas em 24h",
    },
    {
      label: "Etiquetas",
      value: labelsCount,
      href: "/etiquetas",
      icon: Tag,
      hint: "pra organizar",
    },
  ];

  const nextSteps = [
    {
      label: "Configurar Evolution (URL, key, instância)",
      href: "/configuracoes?tab=workspace",
      icon: Settings,
    },
    {
      label: "Criar etiquetas pra organizar conversas",
      href: "/etiquetas",
      icon: Tag,
    },
    {
      label: "Ligar automações de primeira mensagem",
      href: "/configuracoes?tab=automacoes",
      icon: Zap,
    },
    {
      label: "Convidar sua equipe",
      href: "/configuracoes?tab=equipe",
      icon: UserCog,
    },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-10 max-w-6xl mx-auto">
      {/* Hero */}
      <header className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-stone-500 mb-2">
          {dateLabel}
        </p>
        <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
          {hello}, {firstName}.
        </h1>
        <p className="mt-2 text-[14px] text-stone-500 dark:text-stone-400 max-w-xl">
          Aqui está como sua loja está atendendo hoje.{" "}
          <Link
            href="/conversations"
            className="text-brand-600 hover:text-brand-700 inline-flex items-center gap-0.5 font-medium"
          >
            Abrir conversas <ArrowUpRight className="h-3 w-3" />
          </Link>
        </p>
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {kpis.map(({ label, value, total, href, icon: Icon, hint, accent }) => (
          <Link
            key={label}
            href={href}
            className={`group rounded-xl border bg-white dark:bg-stone-900 p-5 transition-all ${
              accent
                ? "border-stone-200 dark:border-stone-800 ring-1 ring-brand-600/10 hover:ring-brand-600/30 hover:border-brand-600/30 shadow-sm"
                : "border-stone-200/80 dark:border-stone-800/80 hover:border-stone-300 dark:hover:border-stone-700"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-stone-500">
                {label}
              </span>
              <span
                className={`h-7 w-7 rounded-lg flex items-center justify-center ${
                  accent
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400"
                    : "bg-stone-100 dark:bg-stone-800 text-stone-500"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-semibold tracking-tight tabular-nums text-stone-900 dark:text-stone-50">
                {value}
              </span>
              {total !== undefined && total !== value && (
                <span className="text-sm text-stone-400 tabular-nums">/ {total}</span>
              )}
            </div>
            {hint && (
              <p className="mt-1 text-[11.5px] text-stone-500 flex items-center gap-1.5">
                {accent && openConversations > 0 && (
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse" />
                )}
                {hint}
              </p>
            )}
          </Link>
        ))}
      </section>

      {/* Bottom row: pipeline summary + next steps */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Pipeline */}
        <div className="rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-stone-900 p-5 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-stone-500">
              Pipeline
            </span>
            <span className="h-7 w-7 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-500 flex items-center justify-center">
              <Columns3 className="h-3.5 w-3.5" />
            </span>
          </div>
          <p className="text-3xl font-semibold tracking-tight tabular-nums text-stone-900 dark:text-stone-50">
            {columnsCount}
          </p>
          <p className="text-[11.5px] text-stone-500 mt-1">
            colunas configuradas
          </p>
          <Link
            href="/pipeline"
            className="mt-4 inline-flex items-center gap-1 text-[12px] font-medium text-brand-600 hover:text-brand-700"
          >
            Ver pipeline <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Next steps */}
        <div className="rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-stone-900 p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-stone-500">
              Próximos passos
            </span>
            <span className="h-7 w-7 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-500 flex items-center justify-center">
              <Zap className="h-3.5 w-3.5" />
            </span>
          </div>
          <ol className="space-y-0.5">
            {nextSteps.map((step, i) => (
              <li key={i}>
                <Link
                  href={step.href}
                  className="group flex items-center gap-3 px-2.5 py-2 -mx-2.5 rounded-md hover:bg-stone-50 dark:hover:bg-stone-800/60 transition-colors"
                >
                  <span className="shrink-0 h-6 w-6 rounded-md bg-stone-100 dark:bg-stone-800 text-[11px] font-semibold text-stone-600 dark:text-stone-400 flex items-center justify-center group-hover:bg-brand-100 group-hover:text-brand-700 dark:group-hover:bg-brand-500/20 dark:group-hover:text-brand-400 transition-colors">
                    {i + 1}
                  </span>
                  <step.icon className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                  <span className="flex-1 text-[13px] text-stone-700 dark:text-stone-300 group-hover:text-stone-900 dark:group-hover:text-stone-100">
                    {step.label}
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-stone-400 group-hover:text-brand-600 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}
