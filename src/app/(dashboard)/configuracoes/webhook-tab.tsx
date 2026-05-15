import { Webhook, ArrowRight, MessageSquare, Database, Bot } from "lucide-react";
import { SectionCard } from "@/components/ui";

export function WebhookTab({ workspaceConfigured }: { workspaceConfigured: boolean }) {
  const webhookUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/webhook`
      : "https://garciasadler.vercel.app/api/webhook";

  return (
    <div className="space-y-6">
      <SectionCard
        title="Webhook do Evolution"
        description="URL que recebe mensagens em tempo real."
      >
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Webhook className="h-4 w-4 text-brand-orange-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Endpoint
            </span>
          </div>
          <code className="block text-xs font-mono text-slate-900 dark:text-slate-100 break-all">
            {webhookUrl}
          </code>
        </div>

        {!workspaceConfigured && (
          <div className="mt-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-3">
            <p className="text-xs text-amber-800 dark:text-amber-300">
              Configure a aba <b>Workspace</b> com URL, instância e API key do Evolution antes de
              testar o webhook.
            </p>
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Como funciona"
        description="O caminho de uma mensagem até aparecer no painel."
      >
        <ol className="space-y-3">
          {[
            {
              icon: MessageSquare,
              title: "Cliente envia WhatsApp",
              text: "Mensagem chega no número conectado da sua instância Evolution.",
            },
            {
              icon: Webhook,
              title: "Evolution dispara webhook",
              text: "POST com payload messages.upsert pro endpoint acima.",
            },
            {
              icon: Database,
              title: "Garcia Sadler processa",
              text: "Identifica workspace pela instância, salva contato, conversa e mensagem.",
            },
            {
              icon: Bot,
              title: "Automações + Realtime",
              text: "Roda automações (etiqueta, atribuir, responder) e dispara evento Pusher pra UI.",
            },
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <div className="shrink-0 h-9 w-9 rounded-xl bg-brand-orange-500/10 text-brand-orange-500 flex items-center justify-center font-bold text-xs">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold flex items-center gap-1.5">
                  <step.icon className="h-3.5 w-3.5 text-slate-400" />
                  {step.title}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">{step.text}</p>
              </div>
              {i < 3 && (
                <ArrowRight className="hidden md:block h-3.5 w-3.5 text-slate-300 mt-3" />
              )}
            </li>
          ))}
        </ol>
      </SectionCard>

      <SectionCard
        title="Eventos escutados"
        description="O Evolution só nos envia esses eventos."
      >
        <ul className="space-y-2">
          <li className="flex items-center gap-3 text-sm">
            <code className="px-2 py-0.5 rounded bg-brand-orange-500/10 text-brand-orange-600 text-xs font-mono">
              messages.upsert
            </code>
            <span className="text-slate-600 dark:text-slate-400">
              Nova mensagem recebida ou enviada (sincronização do celular)
            </span>
          </li>
          <li className="flex items-center gap-3 text-sm">
            <code className="px-2 py-0.5 rounded bg-brand-orange-500/10 text-brand-orange-600 text-xs font-mono">
              messages.update
            </code>
            <span className="text-slate-600 dark:text-slate-400">
              ACK do WhatsApp (entregue/lido)
            </span>
          </li>
        </ul>
      </SectionCard>
    </div>
  );
}
