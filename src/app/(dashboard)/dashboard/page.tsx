import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { MessageSquare, Users, Tag, Columns3 } from "lucide-react";
import { PageHeader, SectionCard } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  const workspaceId = session!.user.workspaceId;

  const [conversations, contacts, labels, openConversations, columns] = await Promise.all([
    prisma.conversation.count({ where: { workspaceId } }),
    prisma.contact.count({ where: { workspaceId } }),
    prisma.label.count({ where: { workspaceId } }),
    prisma.conversation.count({ where: { workspaceId, status: "open" } }),
    prisma.kanbanColumn.count({ where: { workspaceId } }),
  ]);

  const cards = [
    {
      label: "Conversas abertas",
      value: openConversations,
      total: conversations,
      href: "/conversations",
      icon: MessageSquare,
      iconBg: "bg-brand-500/10",
      iconColor: "text-brand-500",
    },
    {
      label: "Contatos",
      value: contacts,
      href: "/contatos",
      icon: Users,
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-600",
    },
    {
      label: "Etiquetas",
      value: labels,
      href: "/etiquetas",
      icon: Tag,
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-600",
    },
    {
      label: "Colunas no pipeline",
      value: columns,
      href: "/pipeline",
      icon: Columns3,
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-600",
    },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      <PageHeader
        title={`Olá, ${session!.user.name?.split(" ")[0]}`}
        description="Visão geral do seu workspace."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {cards.map(({ label, value, total, href, icon: Icon, iconBg, iconColor }) => (
          <Link
            key={label}
            href={href}
            className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 hover:border-brand-500/40 transition group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">
                {label}
              </span>
              <span
                className={`h-9 w-9 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center`}
              >
                <Icon className="h-4 w-4" />
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold tracking-tight">{value}</span>
              {total !== undefined && total !== value && (
                <span className="text-sm text-stone-500">/ {total}</span>
              )}
            </div>
          </Link>
        ))}
      </div>

      <SectionCard
        title="Próximos passos"
        description="Configure o workspace pra começar a atender."
      >
        <ol className="text-sm space-y-2 text-stone-600 dark:text-stone-400 list-decimal list-inside">
          <li>
            Confira o Evolution API em{" "}
            <Link
              className="text-brand-600 hover:underline font-medium"
              href="/configuracoes?tab=workspace"
            >
              Configurações → Workspace
            </Link>
          </li>
          <li>
            Crie etiquetas em{" "}
            <Link className="text-brand-600 hover:underline font-medium" href="/etiquetas">
              /etiquetas
            </Link>{" "}
            pra organizar conversas
          </li>
          <li>
            Configure automações em{" "}
            <Link
              className="text-brand-600 hover:underline font-medium"
              href="/configuracoes?tab=automacoes"
            >
              Configurações → Automações
            </Link>
          </li>
          <li>
            Convide sua equipe em{" "}
            <Link
              className="text-brand-600 hover:underline font-medium"
              href="/configuracoes?tab=equipe"
            >
              Configurações → Equipe
            </Link>
          </li>
        </ol>
      </SectionCard>
    </div>
  );
}
