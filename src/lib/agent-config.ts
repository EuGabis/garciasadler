import { prisma } from "@/lib/db";
import { decryptSecret } from "@/lib/secrets";

export type AgentConfigData = {
  enabled: boolean;
  systemPrompt: string | null;
  stopCommand: string;
  model: string;
  apiKey: string | null; // descriptografada
  tokensUsedTotal: number;
  tokensUsedMonth: number;
};

const DEFAULT_SYSTEM_PROMPT = `Você é o atendente virtual da Garcia Sadler, loja de materiais de construção.

REGRAS:
1. Atenda em português brasileiro, de forma cordial e objetiva. Use tratamento informal mas profissional.
2. Pra preço, estoque, ou características de produto, SEMPRE use a ferramenta buscar_produto antes de responder. NUNCA invente valores ou disponibilidade.
3. Pra perguntas de quantidade de material pra obra ("quanto preciso de cimento pra 30m² de contrapiso?"), use a ferramenta calcular_obra.
4. Se o cliente pedir lista de produtos, sugira buscar por categoria.
5. Não prometa prazo de entrega, frete ou condições de pagamento — isso depende de cada caso e tem que ser combinado com atendente humano.
6. Se a pergunta é complexa, fora de produtos, ou se o cliente parece irritado, diga que um atendente humano vai assumir.
7. Mensagens curtas. Sem floreios. Quando listar produtos, mostre nome, preço e estoque.`;

/**
 * Lê AgentConfig do workspace, criando defaults se não existir.
 * Retorna apiKey descriptografada.
 */
export async function getAgentConfig(workspaceId: string): Promise<AgentConfigData> {
  const raw = await prisma.agentConfig.findUnique({ where: { workspaceId } });
  if (!raw) {
    return {
      enabled: false,
      systemPrompt: null,
      stopCommand: "/atendente",
      model: "gpt-4o-mini",
      apiKey: null,
      tokensUsedTotal: 0,
      tokensUsedMonth: 0,
    };
  }
  return {
    enabled: raw.enabled,
    systemPrompt: raw.systemPrompt,
    stopCommand: raw.stopCommand ?? "/atendente",
    model: raw.model,
    apiKey: decryptSecret(raw.apiKey),
    tokensUsedTotal: raw.tokensUsedTotal,
    tokensUsedMonth: raw.tokensUsedMonth,
  };
}

export function resolveSystemPrompt(config: AgentConfigData): string {
  return (config.systemPrompt && config.systemPrompt.trim().length > 0)
    ? config.systemPrompt
    : DEFAULT_SYSTEM_PROMPT;
}

export async function incrementTokenUsage(
  workspaceId: string,
  promptTokens: number,
  completionTokens: number
): Promise<void> {
  const total = promptTokens + completionTokens;
  await prisma.agentConfig.upsert({
    where: { workspaceId },
    create: {
      workspaceId,
      tokensUsedMonth: total,
      tokensUsedTotal: total,
    },
    update: {
      tokensUsedMonth: { increment: total },
      tokensUsedTotal: { increment: total },
    },
  });
}

export { DEFAULT_SYSTEM_PROMPT };
