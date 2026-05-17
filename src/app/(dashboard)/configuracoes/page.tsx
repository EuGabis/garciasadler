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
  AlertTriangle,
} from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { PageHeader, cn } from "@/components/ui";
import { canManageTeam } from "@/lib/team";
import { listErrors, countUnacknowledged, listScopes, type ErrorLevel } from "@/lib/error-logs";
import { WorkspaceTab } from "./workspace-tab";
import { WebhookTab } from "./webhook-tab";
import { AccountTab } from "./account-tab";
import { AiTab } from "./ai-tab";
import { AutomacoesTab } from "./automacoes-tab";
import { RespostasRapidasTab } from "./respostas-rapidas-tab";
import { EquipeTab } from "./equipe-tab";
import { ExatoTab } from "./exato-tab";
import { LogsTab } from "./logs-tab";

export const dynamic = "force-dynamic";

type Search = { tab?: string; level?: string; scope?: string; unack?: string };

const TABS = [
  { value: "workspace", label: "Workspace", icon: Building2 },
  { value: "webhook", label: "Webhook", icon: Webhook },
  { value: "exato", label: "Integração Exato", icon: Plug },
  { value: "automacoes", label: "Automações", icon: Zap },
  { value: "respostas-rapidas", label: "Respostas rápidas", icon: Sparkles },
  { value: "equipe", label: "Equipe", icon: UserCog },
  { value: "conta", label: "Conta", icon: UserCircle },
  { value: "ia", label: "IA", icon: Bot },
  { value: "logs", label: "Logs & Erros", icon: AlertTriangle },
] as const;

type TabValue = (typeof TABS)[number]["value"];

function validTab(s: string | undefined): TabValue {
  const valid = TABS.map((t) => t.value) as readonly string[];
  if (s && valid.includes(s)) return s as TabValue;
  return "workspace";
}

function validLevel(s: string | undefined): ErrorLevel | undefined {
  if (s === "warn" || s === "error" || s === "fatal") return s;
  return undefined;
}

export default async function ConfiguracoesPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const params = await searchParams;
  const activeTab = validTab(params.tab);

  const session = await auth();

  // Sempre carrega contagem de erros pendentes pra badge no menu
  const unackCount = await countUnacknowledged(session!.user.workspaceId);

  const [workspaceRaw, user, integExato, aiConfig] = await Promise.all([
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
    prisma.agentConfig.findUnique({
      where: { workspaceId: session!.user.workspaceId },
      select: {
        enabled: true,
        systemPrompt: true,
        model: true,
        apiKey: true,
        tokensUsedMonth: true,
        tokensUsedTotal: true,
        tokensResetAt: true,
      },
    }),
  ]);

  if (!workspaceRaw || !user) {
    return <div className="p-8">Workspace ou usuário não encontrado.</div>;
  }

  const canManage = canManageTeam(session!.user.role);
  const workspaceConfigured = !!(
    workspaceRaw.evolutionUrl &&
    workspaceRaw.evolutionKey &&
    workspaceRaw.evolutionInstance
  );

  const workspace = {
    name: workspaceRaw.name,
    slug: workspaceRaw.slug,
    evolutionUrl: workspaceRaw.evolutionUrl,
    evolutionInstance: workspaceRaw.evolutionInstance,
    hasEvolutionKey: !!workspaceRaw.evolutionKey,
  };

  const maskUsuario = (u: string | null) =>
    u ? (u.length <= 4 ? "***" : `${u.slice(0, 2)}***${u.slice(-1)}`) : null;
  const aiConfigView = {
    enabled: aiConfig?.enabled ?? false,
    systemPrompt: aiConfig?.systemPrompt ?? null,
    model: aiConfig?.model ?? "gpt-4o-mini",
    hasApiKey: !!aiConfig?.apiKey,
    tokensUsedMonth: aiConfig?.tokensUsedMonth ?? 0,
    tokensUsedTotal: aiConfig?.tokensUsedTotal ?? 0,
    tokensResetAt: aiConfig?.tokensResetAt ?? null,
  };

  const integExatoView = {
    hasCredentials: !!integExato,
    usuario: maskUsuario(integExato?.usuario ?? null),
    lojaId: integExato?.lojaId ?? null,
    lojaNome: integExato?.lojaNome ?? null,
    lojaCodigoAcesso: integExato?.lojaCodigoAcesso ?? null,
    ultimoLoginEm: integExato?.ultimoLoginEm ?? null,
    ultimoErro: integExato?.ultimoErro ?? null,
  };

  // Logs: só carrega quando a aba está aberta (evita query extra)
  let logsData: {
    errors: Awaited<ReturnType<typeof listErrors>>;
    scopes: string[];
    filters: { level?: ErrorLevel; scope?: string; onlyUnack: boolean };
  } | null = null;
  if (activeTab === "logs") {
    const level = validLevel(params.level);
    const scope = params.scope || undefined;
    const onlyUnack = params.unack === "1";
    const [errors, scopes] = await Promise.all([
      listErrors(session!.user.workspaceId, { level, scope, onlyUnack, limit: 200 }),
      listScopes(session!.user.workspaceId),
    ]);
    logsData = { errors, scopes, filters: { level, scope, onlyUnack } };
  }

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto text-stone-100">
      <PageHeader
        eyebrow="Sistema"
        title="Configurações"
        description="Workspace, integrações, equipe, automações e diagnósticos."
      />

      <nav className="mb-6 flex flex-wrap gap-1 p-1 glass rounded-xl">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.value;
          const showBadge = tab.value === "logs" && unackCount > 0;
          return (
            <Link
              key={tab.value}
              href={`/configuracoes?tab=${tab.value}`}
              className={cn(
                "relative flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg transition-all",
                isActive
                  ? "bg-brand-500 text-white shadow-brand-glow"
                  : "text-stone-300 hover:bg-white/[0.06] hover:text-white"
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
              {showBadge && (
                <span
                  className={cn(
                    "ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold",
                    isActive ? "bg-white text-brand-600" : "bg-red-500 text-white"
                  )}
                >
                  {unackCount > 99 ? "99+" : unackCount}
                </span>
              )}
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
        {activeTab === "ia" && <AiTab config={aiConfigView} canEdit={canManage} />}
        {activeTab === "logs" && logsData && (
          <LogsTab
            errors={logsData.errors}
            scopes={logsData.scopes}
            filters={logsData.filters}
            unackCount={unackCount}
            canManage={canManage}
          />
        )}
      </div>
    </div>
  );
}
