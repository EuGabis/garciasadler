"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bot, Key, Save, Cpu, Sparkles, Zap } from "lucide-react";
import {
  saveAiConfigAction,
  testOpenAiAction,
  resetMonthlyTokensAction,
  type AiConfigState,
} from "./ai-actions";
import {
  Section,
  INPUT_CLS,
  LABEL_CLS,
  BTN_PRIMARY,
  BTN_SECONDARY,
  ERROR_BOX,
  SUCCESS_BOX,
} from "./_ui";

type Props = {
  config: {
    enabled: boolean;
    systemPrompt: string | null;
    model: string;
    hasApiKey: boolean;
    tokensUsedMonth: number;
    tokensUsedTotal: number;
    tokensResetAt: Date | null;
  };
  canEdit: boolean;
};

const KEY_UNCHANGED_SENTINEL = "__UNCHANGED__";

const MODELS = [
  { value: "gpt-4o-mini", label: "GPT-4o mini (mais barato, recomendado)" },
  { value: "gpt-4o", label: "GPT-4o (mais capaz, ~10× mais caro)" },
  { value: "gpt-4.1-mini", label: "GPT-4.1 mini (novo, ótimo balanço)" },
  { value: "gpt-4.1", label: "GPT-4.1 (premium)" },
];

export function AiTab({ config, canEdit }: Props) {
  const [state, formAction, pending] = useActionState<AiConfigState, FormData>(
    saveAiConfigAction,
    null
  );
  const [enabled, setEnabled] = useState(config.enabled);
  const [model, setModel] = useState(config.model);
  const router = useRouter();

  // Sincroniza estado controlado com a prop quando o server re-fetcha
  // (ex: após router.refresh pós-save).
  useEffect(() => {
    setEnabled(config.enabled);
  }, [config.enabled]);
  useEffect(() => {
    setModel(config.model);
  }, [config.model]);

  // Refresh apenas UMA vez quando state.ok vira true - antes estava no corpo
  // do componente sem useEffect, disparando refreshes em cascata e deixando
  // o estado client desincronizado com o DB.
  useEffect(() => {
    if (state?.ok) {
      router.refresh();
    }
  }, [state?.ok, router]);

  return (
    <div className="space-y-3">
      <Section
        title="Assistente de IA"
        description="Responde automaticamente conversas usando OpenAI + tool use no seu estoque."
      >
        <form action={formAction} className="space-y-5">
          <label className="flex items-start gap-3 cursor-pointer p-3.5 rounded-lg bg-stone-50 dark:bg-stone-800/40 border border-stone-200/80 dark:border-stone-700/60">
            <input
              type="checkbox"
              name="enabled"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              disabled={!canEdit}
              className="h-4 w-4 mt-0.5 rounded border-stone-300 text-brand-600 focus:ring-2 focus:ring-brand-500/40"
            />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold tracking-tight flex items-center gap-1.5 text-stone-900 dark:text-stone-50">
                <Bot className="h-3.5 w-3.5 text-brand-600" />
                IA ativa globalmente
              </p>
              <p className="text-[12px] text-stone-500 mt-1 leading-relaxed">
                Quando ligada, responde automaticamente conversas com{" "}
                <code className="text-[10.5px] bg-stone-200 dark:bg-stone-700 px-1.5 py-0.5 rounded font-mono">
                  aiEnabled=true
                </code>
                . Quando um agente humano envia mensagem, a IA pausa automaticamente naquela conversa.
              </p>
            </div>
          </label>

          <div>
            <label htmlFor="apiKey" className={`${LABEL_CLS} flex items-center gap-1.5`}>
              <Key className="h-3 w-3" /> Chave OpenAI
            </label>
            <input
              id="apiKey"
              name="apiKey"
              type="password"
              autoComplete="off"
              placeholder={
                config.hasApiKey ? "•••••••••••• (deixe assim pra manter)" : "sk-…"
              }
              defaultValue={config.hasApiKey ? KEY_UNCHANGED_SENTINEL : ""}
              disabled={!canEdit}
              className={INPUT_CLS}
            />
            <p className="mt-1.5 text-[11.5px] text-stone-500">
              Criptografada (AES-256-GCM). Crie em platform.openai.com/api-keys
            </p>
          </div>

          <div>
            <label htmlFor="model" className={`${LABEL_CLS} flex items-center gap-1.5`}>
              <Cpu className="h-3 w-3" /> Modelo
            </label>
            <select
              id="model"
              name="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={!canEdit}
              className={INPUT_CLS}
            >
              {MODELS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="systemPrompt"
              className={`${LABEL_CLS} flex items-center gap-1.5`}
            >
              <Sparkles className="h-3 w-3" /> Personalidade da IA (system prompt)
            </label>
            <textarea
              id="systemPrompt"
              name="systemPrompt"
              rows={8}
              maxLength={50000}
              defaultValue={config.systemPrompt ?? ""}
              placeholder="Deixe vazio para usar o prompt padrão da Garcia Sadler. Sobreescreva para customizar o tom de voz, regras de negócio, política de preços, etc."
              disabled={!canEdit}
              className={`${INPUT_CLS} resize-y`}
            />
            <p className="mt-1.5 text-[11.5px] text-stone-500 leading-relaxed">
              Ferramentas disponíveis para a IA:{" "}
              <code className="text-[10.5px] bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded font-mono text-stone-700 dark:text-stone-300">
                buscar_produto
              </code>{" "}
              (consulta Exato) e{" "}
              <code className="text-[10.5px] bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded font-mono text-stone-700 dark:text-stone-300">
                calcular_obra
              </code>{" "}
              (contrapiso, alvenaria, reboco, telhado, pintura, concreto, aço).
            </p>
          </div>

          {state?.ok && <p className={SUCCESS_BOX}>Configuração salva.</p>}
          {state?.error && <p className={ERROR_BOX}>{state.error}</p>}

          {canEdit && (
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
              {config.hasApiKey && <TestConnectionButton />}
              <button type="submit" disabled={pending} className={BTN_PRIMARY}>
                <Save className="h-3.5 w-3.5" />
                {pending ? "Salvando…" : "Salvar configuração"}
              </button>
            </div>
          )}
        </form>
      </Section>

      <Section title="Uso de tokens" description="Consumo na OpenAI desde o último reset.">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-stone-200/80 dark:border-stone-800/80 p-4">
            <p className="text-[10.5px] uppercase tracking-[0.08em] text-stone-500 font-semibold">
              Mês atual
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums text-stone-900 dark:text-stone-50">
              {config.tokensUsedMonth.toLocaleString("pt-BR")}
            </p>
            <p className="text-[11.5px] text-stone-500 mt-1 tabular-nums">
              {config.tokensResetAt
                ? `Reset em ${new Date(config.tokensResetAt).toLocaleDateString("pt-BR")}`
                : "-"}
            </p>
          </div>
          <div className="rounded-lg border border-stone-200/80 dark:border-stone-800/80 p-4">
            <p className="text-[10.5px] uppercase tracking-[0.08em] text-stone-500 font-semibold">
              Total acumulado
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums text-stone-900 dark:text-stone-50">
              {config.tokensUsedTotal.toLocaleString("pt-BR")}
            </p>
            <p className="text-[11.5px] text-stone-500 mt-1">desde sempre</p>
          </div>
        </div>
        {canEdit && (
          <div className="mt-4">
            <ResetMonthlyButton />
          </div>
        )}
      </Section>

      <Section
        title="Como funciona"
        description="O fluxo de uma mensagem do cliente até a resposta da IA."
      >
        <ol className="space-y-3">
          {[
            { icon: Bot, txt: "Cliente manda mensagem WhatsApp" },
            {
              icon: Cpu,
              txt: "Webhook salva mensagem e verifica se IA está ativa nessa conversa",
            },
            {
              icon: Zap,
              txt: "IA consulta o estoque (Exato) e calcula materiais com fórmulas reais",
            },
            { icon: Sparkles, txt: "Resposta volta no WhatsApp em ~3-8 segundos" },
            {
              icon: Bot,
              txt: "Se agente humano enviar mensagem, IA pausa automaticamente naquela conversa",
            },
          ].map((step, i) => (
            <li key={i} className="flex items-center gap-3">
              <span className="shrink-0 h-7 w-7 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 flex items-center justify-center font-semibold text-[11.5px] tabular-nums">
                {i + 1}
              </span>
              <step.icon className="h-3.5 w-3.5 text-stone-400 shrink-0" />
              <span className="text-[13px] text-stone-700 dark:text-stone-300">{step.txt}</span>
            </li>
          ))}
        </ol>
      </Section>
    </div>
  );
}

function TestConnectionButton() {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setResult(null);
            const r = await testOpenAiAction();
            if (r.error) setResult(` ${r.error}`);
            else if (r.ok) setResult(` Conexão ok (${r.model ?? "modelo confirmado"})`);
          })
        }
        className={BTN_SECONDARY}
      >
        <Zap className="h-3.5 w-3.5" />
        {pending ? "Testando…" : "Testar conexão"}
      </button>
      {result && <span className="text-[12px] text-stone-600 dark:text-stone-400">{result}</span>}
    </>
  );
}

function ResetMonthlyButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm("Resetar contador do mês?")) return;
        start(async () => {
          await resetMonthlyTokensAction();
          router.refresh();
        });
      }}
      className={BTN_SECONDARY}
    >
      Resetar contador do mês
    </button>
  );
}
