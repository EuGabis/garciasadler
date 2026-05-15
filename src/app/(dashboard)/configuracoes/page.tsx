import Link from "next/link";
import {
  Building2,
  Webhook,
  UserCircle,
  Bot,
  Zap,
  Sparkles,
  UserCog,
  Plug,
} from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { PageHeader, cn } from "@/components/ui";
import { canManageTeam } from "@/lib/team";
import { WorkspaceTab } from "./workspace-tab";
import { WebhookTab } from "./webhook-tab";
import { AccountTab } from "./account-tab";
import { AiTab } from "./ai-tab";
import { AutomacoesTab } from "./automacoes-tab";
import { RespostasRapidasTab } from "./respostas-rapidas-tab";
import { EquipeTab } from "./equipe-tab";
import { ExatoTab } from "./exato-tab";

export const dynamic = "force-dynamic";

type Search = { tab?: string };

const TABS = [
  { value: "workspace", label: "Workspace", icon: Building2 },
  { value: "webhook", label: "Webhook", icon: Webhook },
  { value: "exato", label: "Integração Exato", icon: Plug },
  { value: "automacoes", label: "Automações", icon: Zap },
  { value: "respostas-rapidas", label: "Respostas rápidas", icon: Sparkles },
  { value: "equipe", label: "Equipe", icon: UserCog },
  { value: "conta", label: "Conta", icon: UserCircle },
  { value: "ia", label: "IA", icon: Bot },
] as const;

type TabValue = (typeof TABS)[number]["value"];

function validTab(s: string | undefined): TabValue {
  const valid = TABS.map((t) => t.value) as readonly string[];
  if (s && valid.includes(s)) return s as TabValue;
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
  const [workspace, user, integExato] = await Promise.all([
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
    prisma.integracaoExato.findUnique({
      where: { workspaceId: session!.user.workspaceId },
      select: {
        usuario: true,
        lojaId: true,
        lojaNome: true,
        lojaCodigoAcesso: true,
        ultimoLoginEm: true,
        ultimoErro: true,
      },
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

  const integExatoView = {
    hasCredentials: !!integExato,
    usuario: integExato?.usuario ?? null,
    lojaId: integExato?.lojaId ?? null,
    lojaNome: integExato?.lojaNome ?? null,
    lojaCodigoAcesso: integExato?.lojaCodigoAcesso ?? null,
    ultimoLoginEm: integExato?.ultimoLoginEm ?? null,
    ultimoErro: integExato?.ultimoErro ?? null,
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <PageHeader
        title="Configurações"
        description="Workspace, integrações, equipe e automações."
      />

      <nav className="mb-6 flex flex-wrap gap-1 p-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-sm">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.value;
          return (
            <Link
              key={tab.value}
              href={`/configuracoes?tab=${tab.value}`}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-all",
                isActive
                  ? "bg-brand-500 text-white shadow-md shadow-brand-500/30"
                  : "text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/60"
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
        {activeTab === "exato" && <ExatoTab integ={integExatoView} canEdit={canManage} />}
        {activeTab === "automacoes" && (
          <AutomacoesTab workspaceId={session!.user.workspaceId} />
        )}
        {activeTab === "respostas-rapidas" && (
          <RespostasRapidasTab workspaceId={session!.user.workspaceId} />
        )}
        {activeTab === "equipe" && <EquipeTab />}
        {activeTab === "conta" && <AccountTab user={user} />}
        {activeTab === "ia" && <AiTab />}
      </div>
    </div>
  );
}
