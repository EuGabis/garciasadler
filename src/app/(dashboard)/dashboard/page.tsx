import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { MessageSquare, Users, Tag, Kanban } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  const workspaceId = session!.user.workspaceId;

  const [conversations, contacts, labels, openConversations] = await Promise.all([
    prisma.conversation.count({ where: { workspaceId } }),
    prisma.contact.count({ where: { workspaceId } }),
    prisma.label.count({ where: { workspaceId } }),
    prisma.conversation.count({ where: { workspaceId, status: "open" } }),
  ]);

  const cards = [
    { label: "Conversas abertas", value: openConversations, total: conversations, href: "/conversations", icon: MessageSquare, color: "indigo" },
    { label: "Contatos", value: contacts, href: "/contatos", icon: Users, color: "emerald" },
    { label: "Etiquetas", value: labels, href: "/etiquetas", icon: Tag, color: "amber" },
    { label: "Pipeline", value: 0, href: "/pipeline", icon: Kanban, color: "rose" },
  ];

  return (
    <div className="p-8 max-w-6xl">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Olá, {session!.user.name}</h1>
        <p className="mt-1 text-sm text-zinc-500">Visão geral do seu workspace.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, total, href, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 hover:border-zinc-300 dark:hover:border-zinc-700 transition"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-zinc-500">{label}</span>
              <Icon className="h-4 w-4 text-zinc-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold">{value}</span>
              {total !== undefined && total !== value && (
                <span className="text-sm text-zinc-500">/ {total}</span>
              )}
            </div>
          </Link>
        ))}
      </div>

      <section className="mt-10 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
        <h2 className="text-base font-semibold mb-3">Próximos passos</h2>
        <ol className="text-sm space-y-2 text-zinc-600 dark:text-zinc-400 list-decimal list-inside">
          <li>
            Configure o Evolution API em{" "}
            <Link className="text-indigo-600 hover:underline" href="/configuracoes">
              Configurações
            </Link>
          </li>
          <li>Conecte uma instância WhatsApp e teste o webhook</li>
          <li>Crie etiquetas e colunas do pipeline conforme seu fluxo</li>
        </ol>
      </section>
    </div>
  );
}
