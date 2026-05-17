"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bot, Key, Save, Cpu, Sparkles, Zap } from "lucide-react";
import { Button, Input, Label, SectionCard, Textarea } from "@/components/ui";
import { saveAiConfigAction, testOpenAiAction, resetMonthlyTokensAction, type AiConfigState } from "./ai-actions";

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
  { value: "gpt-4o", label: "GPT-4o (mais capaz, ~10x mais caro)" },
  { value: "gpt-4.1-mini", label: "GPT-4.1 mini (novo, ótimo balanço)" },
  { value: "gpt-4.1", label: "GPT-4.1 (premium)" },
];

export function AiTab({ config, canEdit }: Props) {
  const [state, formAction, pending] = useActionState<AiConfigState, FormData>(
    saveAiConfigAction,
    null
  );
  const [enabled, setEnabled] = useState(config.enabled);
  const router = useRouter();

  if (state?.ok && state) {
    // refresh suave após salvar
    setTimeout(() => router.refresh(), 50);
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title="Assistente de IA"
        description="Responde automaticamente conversas usando OpenAI + tool use no seu estoque."
      >
        <form action={formAction} className="space-y-5">
          <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl bg-white/[0.04] border border-white/10 hover:border-brand-500/30 transition">
            <input
              type="checkbox"
              name="enabled"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              disabled={!canEdit}
              className="h-4 w-4 mt-0.5 rounded accent-brand-500"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold flex items-center gap-1.5 text-white">
                <Bot className="h-3.5 w-3.5 text-brand-300" />
                IA ativa globalmente
              </p>
              <p className="text-xs text-stone-400 mt-1">
                Quando ligada, responde automaticamente conversas com{" "}
                <code className="text-[10px] bg-white/[0.06] text-stone-200 px-1 rounded">
                  aiEnabled=true
                </code>
                . Quando um agente humano envia mensagem, a IA pausa automaticamente naquela conversa.
              </p>
            </div>
          </label>

          <div>
            <Label htmlFor="apiKey" className="flex items-center gap-1.5">
              <Key className="h-3 w-3" /> Chave OpenAI
            </Label>
            <Input
              id="apiKey"
              name="apiKey"
              type="password"
              autoComplete="off"
              placeholder={config.hasApiKey ? "•••••••••••• (deixe assim pra manter)" : "sk-..."}
              defaultValue={config.hasApiKey ? KEY_UNCHANGED_SENTINEL : ""}
              disabled={!canEdit}
            />
            <p className="mt-1 text-[11px] text-stone-500">
              Criptografada (AES-256-GCM). Crie em platform.openai.com/api-keys
            </p>
          </div>

          <div>
            <Label htmlFor="model" className="flex items-center gap-1.5">
              <Cpu className="h-3 w-3" /> Modelo
            </Label>
            <select
              id="model"
              name="model"
              defaultValue={config.model}
              disabled={!canEdit}
              className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-stone-100 focus:outline-none focus:ring-2 focus:ring-brand-500/60"
            >
              {MODELS.map((m) => (
                <option key={m.value} value={m.value} className="bg-stone-900">
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="systemPrompt" className="flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" /> Personalidade da IA (system prompt)
            </Label>
            <Textarea
              id="systemPrompt"
              name="systemPrompt"
              rows={8}
              maxLength={8000}
              defaultValue={config.systemPrompt ?? ""}
              placeholder="Deixe vazio pra usar o prompt padrão da Garcia Sadler. Sobreescreva pra customizar o tom de voz, regras de negócio, política de preços, etc."
              disabled={!canEdit}
            />
            <p className="mt-1.5 text-[11px] text-stone-400">
              Ferramentas disponíveis pra IA:{" "}
              <code className="text-[10px] bg-white/[0.06] text-stone-200 px-1 rounded">
                buscar_produto
              </code>{" "}
              (consulta Exato) e{" "}
              <code className="text-[10px] bg-white/[0.06] text-stone-200 px-1 rounded">
                calcular_obra
              </code>{" "}
              (contrapiso, alvenaria, reboco, telhado, pintura, concreto, aço).
            </p>
          </div>

          {state?.ok && <p className="text-sm text-emerald-300">Salvo.</p>}
          {state?.error && <p className="text-sm text-red-400">{state.error}</p>}

          {canEdit && (
            <div className="flex items-center gap-2 pt-2">
              <Button type="submit" disabled={pending}>
                <Save className="h-3.5 w-3.5" />
                {pending ? "Salvando..." : "Salvar configuração"}
              </Button>
              {config.hasApiKey && <TestConnectionButton />}
            </div>
          )}
        </form>
      </SectionCard>

      <SectionCard title="Uso de tokens" description="Consumo na OpenAI desde o último reset.">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-brand-300 font-semibold">
              Mês atual
            </p>
            <p className="mt-2 font-display text-3xl text-white tabular-nums leading-none">
              {config.tokensUsedMonth.toLocaleString("pt-BR")}
            </p>
            <p className="text-[11px] text-stone-400 mt-1">
              {config.tokensResetAt
                ? `Reset em ${new Date(config.tokensResetAt).toLocaleDateString("pt-BR")}`
                : "—"}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-brand-300 font-semibold">
              Total acumulado
            </p>
            <p className="mt-2 font-display text-3xl text-white tabular-nums leading-none">
              {config.tokensUsedTotal.toLocaleString("pt-BR")}
            </p>
            <p className="text-[11px] text-stone-400 mt-1">desde sempre</p>
          </div>
        </div>
        {canEdit && (
          <div className="mt-3">
            <ResetMonthlyButton />
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Como funciona"
        description="O fluxo de uma mensagem do cliente até a resposta da IA."
      >
        <ol className="space-y-3 text-sm">
          {[
            { icon: Bot, txt: "Cliente manda mensagem WhatsApp" },
            { icon: Cpu, txt: "Webhook salva mensagem e verifica se IA está ativa nessa conversa" },
            { icon: Zap, txt: "IA consulta o estoque (Exato) e calcula materiais com fórmulas reais" },
            { icon: Sparkles, txt: "Resposta volta no WhatsApp em ~3-8 segundos" },
            { icon: Bot, txt: "Se agente humano enviar mensagem, IA pausa automaticamente naquela conversa" },
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="shrink-0 h-7 w-7 rounded-lg bg-brand-500/15 text-brand-300 ring-1 ring-brand-500/30 flex items-center justify-center font-bold text-xs">
                {i + 1}
              </span>
              <span className="flex-1 text-stone-300 flex items-center gap-2">
                <step.icon className="h-3.5 w-3.5 text-stone-500 shrink-0" />
                {step.txt}
              </span>
            </li>
          ))}
        </ol>
      </SectionCard>
    </div>
  );
}

function TestConnectionButton() {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() =>
          start(async () => {
            setResult(null);
            const r = await testOpenAiAction();
            if (r.error) setResult(`❌ ${r.error}`);
            else if (r.ok) setResult(`✅ Conexão ok (${r.model ?? "modelo confirmado"})`);
          })
        }
        disabled={pending}
      >
        <Zap className="h-3.5 w-3.5" />
        {pending ? "Testando..." : "Testar conexão"}
      </Button>
      {result && <span className="text-xs">{result}</span>}
    </>
  );
}

function ResetMonthlyButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      variant="secondary"
      onClick={() => {
        if (!confirm("Resetar contador do mês?")) return;
        start(async () => {
          await resetMonthlyTokensAction();
          router.refresh();
        });
      }}
      disabled={pending}
    >
      Resetar contador do mês
    </Button>
  );
}
