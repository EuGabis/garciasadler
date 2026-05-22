import { Webhook, MessageSquare, Database, Bot } from "lucide-react";
import { Section } from "./_ui";

const PROD_URL = "https://garciasadler.vercel.app/api/webhook";

export function WebhookTab({ workspaceConfigured }: { workspaceConfigured: boolean }) {
  const steps = [
    {
      icon: MessageSquare,
      title: "Cliente envia WhatsApp",
      text: "Mensagem chega no número conectado da sua instância Evolution.",
    },
    {
      icon: Webhook,
      title: "Evolution dispara webhook",
      text: "POST com payload messages.upsert para o endpoint acima.",
    },
    {
      icon: Database,
      title: "Garcia Sadler processa",
      text: "Identifica workspace pela instância, salva contato, conversa e mensagem.",
    },
    {
      icon: Bot,
      title: "Automações + tempo real",
      text: "Roda automações (etiqueta, atribuir, responder) e dispara evento Pusher para a UI.",
    },
  ];

  return (
    <div className="space-y-3">
      <Section title="Webhook do Evolution" description="URL que recebe mensagens em tempo real.">
        <div className="rounded-lg bg-stone-50 dark:bg-stone-800/40 border border-stone-200/80 dark:border-stone-700/60 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Webhook className="h-3.5 w-3.5 text-brand-600" />
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-stone-500">
              Endpoint
            </span>
          </div>
          <code className="block text-[12px] font-mono text-stone-900 dark:text-stone-100 break-all">
            {PROD_URL}
          </code>
        </div>

        {!workspaceConfigured && (
          <div className="mt-4 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20 p-3">
            <p className="text-[12px] text-amber-800 dark:text-amber-300">
              Configure a aba <b>Workspace</b> com URL, instância e API key do Evolution antes de
              testar o webhook.
            </p>
          </div>
        )}
      </Section>

      <Section
        title="Como funciona"
        description="O caminho de uma mensagem até aparecer no painel."
      >
        <ol className="space-y-3.5">
          {steps.map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="shrink-0 h-7 w-7 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 flex items-center justify-center font-semibold text-[11.5px] tabular-nums">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold tracking-tight flex items-center gap-1.5 text-stone-900 dark:text-stone-50">
                  <step.icon className="h-3.5 w-3.5 text-stone-400" />
                  {step.title}
                </p>
                <p className="mt-0.5 text-[12px] text-stone-500 leading-relaxed">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Eventos escutados" description="O Evolution só nos envia esses eventos.">
        <ul className="space-y-2.5">
          <li className="flex items-center gap-3">
            <code className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-[11.5px] font-mono ring-1 ring-stone-200/60 dark:ring-stone-700/60">
              messages.upsert
            </code>
            <span className="text-[12.5px] text-stone-600 dark:text-stone-400">
              Nova mensagem recebida ou enviada (sincronização do celular)
            </span>
          </li>
          <li className="flex items-center gap-3">
            <code className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-[11.5px] font-mono ring-1 ring-stone-200/60 dark:ring-stone-700/60">
              messages.update
            </code>
            <span className="text-[12.5px] text-stone-600 dark:text-stone-400">
              ACK do WhatsApp (entregue/lido)
            </span>
          </li>
        </ul>
      </Section>
    </div>
  );
}
