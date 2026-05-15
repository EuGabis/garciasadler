import Link from "next/link";
import { Building2, Webhook, UserCircle, Bot } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { PageHeader, cn } from "@/components/ui";
import { canManageTeam } from "@/lib/team";
import { WorkspaceTab } from "./workspace-tab";
import { WebhookTab } from "./webhook-tab";
import { AccountTab } from "./account-tab";
import { AiTab } from "./ai-tab";

export const dynamic = "force-dynamic";

type Search = { tab?: string };

const TABS = [
  { value: "workspace", label: "Workspace", icon: Building2 },
  { value: "webhook", label: "Webhook", icon: Webhook },
  { value: "conta", label: "Conta", icon: UserCircle },
  { value: "ia", label: "IA", icon: Bot },
] as const;

type TabValue = (typeof TABS)[number]["value"];

function validTab(s: string | undefined): TabValue {
  if (s === "workspace" || s === "webhook" || s === "conta" || s === "ia") return s;
  return "workspace";
}

export default async function ConfiguracoesPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const params = await searchParams;
  const activeTab = validTab(params.tab);

  const session = await auth();
  const [workspace, user] = await Promise.all([
    prisma.workspace.findUnique({
      where: { id: session!.user.workspaceId },
      select: {
        name: true,
        slug: true,
        evolutionUrl: true,
        evolutionKey: true,
        evolutionInstance: true,
      },
    }),
    prisma.user.findUnique({
      where: { id: session!.user.id },
      select: { id: true, name: true, email: true, role: true },
    }),
  ]);

  if (!workspace || !user) {
    return <div className="p-8">Workspace ou usuário não encontrado.</div>;
  }

  const canManage = canManageTeam(session!.user.role);
  const workspaceConfigured = !!(
    workspace.evolutionUrl &&
    workspace.evolutionKey &&
    workspace.evolutionInstance
  );

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <PageHeader
        title="Configurações"
        description="Workspace, integrações, conta e equipe."
      />

      <nav className="mb-6 flex flex-wrap gap-1 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.value;
          return (
            <Link
              key={tab.value}
              href={`/configuracoes?tab=${tab.value}`}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-all",
                isActive
                  ? "bg-brand-orange-500 text-white shadow-md shadow-brand-orange-500/30"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <div className="animate-fade-in">
        {activeTab === "workspace" && (
          <WorkspaceTab workspace={workspace} canEdit={canManage} />
        )}
        {activeTab === "webhook" && (
          <WebhookTab workspaceConfigured={workspaceConfigured} />
        )}
        {activeTab === "conta" && <AccountTab user={user} />}
        {activeTab === "ia" && <AiTab />}
      </div>
    </div>
  );
}
