/**
 * Agente IA — Sprint IA.
 *
 * Engine com tool use:
 * - `buscar_produto`: consulta ERP Exato (real).
 * - `calcular_obra`: fórmulas de construção.
 *
 * Chamado pelo webhook quando AgentConfig.enabled && Conversation.aiEnabled.
 * Modo: AUTOMÁTICO (envia direto via Evolution).
 */
import OpenAI from "openai";
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/chat/completions";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { buscarProdutos } from "@/lib/exato/produtos";
import {
  contrapiso,
  alvenaria,
  reboco,
  telhado,
  pintura,
  concreto,
  aco,
} from "@/lib/calc-obra";
import {
  getAgentConfig,
  resolveSystemPrompt,
  incrementTokenUsage,
} from "@/lib/agent-config";

const log = logger("ai/openai");

const MAX_HISTORY = 20;
const MAX_TOOL_ROUNDS = 8;
const MAX_TOKENS_PER_RESPONSE = 600;

// Fallback usado quando IA não consegue gerar texto final (ex: loop de tools).
// Garante que o cliente sempre recebe alguma resposta em vez de silêncio.
const FALLBACK_REPLY =
  "Estou consultando algumas informações pra te ajudar. Um atendente vai dar continuidade em instantes.";

const TOOLS: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "buscar_produto",
      description:
        "Busca produtos no estoque da Garcia Sadler pelo código (SKU) ou descrição. " +
        "Use sempre que cliente perguntar sobre preço, disponibilidade ou características de um produto. " +
        "Retorna até 10 produtos com código, descrição, preço e estoque atual. Nunca invente esses dados.",
      parameters: {
        type: "object",
        properties: {
          termo: {
            type: "string",
            description:
              "Código (até 6 chars, ex: CIM50) ou descrição (ex: cimento, areia, tijolo). " +
              "Use termo curto e específico.",
          },
        },
        required: ["termo"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "calcular_obra",
      description:
        "Calcula a quantidade de materiais necessária pra um tipo de obra. " +
        "Use quando cliente perguntar 'quanto preciso de cimento pra Xm² de contrapiso' ou similar.",
      parameters: {
        type: "object",
        properties: {
          tipo: {
            type: "string",
            enum: ["contrapiso", "alvenaria", "reboco", "telhado", "pintura", "concreto", "aco"],
          },
          areaM2: { type: "number", description: "Área em m². Pra contrapiso/reboco/telhado/pintura." },
          comprimentoM: { type: "number", description: "Comprimento em metros. Pra alvenaria." },
          alturaM: { type: "number", description: "Altura em metros. Pra alvenaria." },
          espessuraCm: { type: "number", description: "Espessura em cm. Default 5 (contrapiso) ou 2 (reboco)." },
          volumeM3: { type: "number", description: "Volume em m³. Pra concreto." },
          quantidadeM: { type: "number", description: "Comprimento total em metros. Pra aço." },
          tipoTelha: { type: "string", enum: ["ceramica", "fibrocimento"], description: "Tipo de telha." },
          elemento: { type: "string", enum: ["viga", "pilar", "laje"], description: "Elemento estrutural (aço)." },
          lados: { type: "number", description: "1 ou 2 lados de reboco. Default 1." },
          demaos: { type: "number", description: "Demãos de pintura. Default 2." },
          bitolaMm: { type: "number", description: "Bitola do aço em mm. Default 8." },
        },
        required: ["tipo"],
      },
    },
  },
];

type ToolContext = { workspaceId: string };

async function executeTool(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<unknown> {
  if (name === "buscar_produto") {
    const termo = String(args.termo ?? "").trim();
    if (!termo) return { erro: "informe um termo de busca" };
    try {
      const produtos = await buscarProdutos(ctx.workspaceId, termo, { tamanho: 10 });
      if (produtos.length === 0) {
        return { encontrados: 0, mensagem: `Nenhum produto com '${termo}'` };
      }
      return {
        encontrados: produtos.length,
        produtos: produtos.slice(0, 10).map((p) => ({
          codigo: p.codigo,
          descricao: p.descricao,
          marca: p.marca,
          grupo: p.grupo,
          preco: p.precoVenda,
          estoque: p.quantidadeDisponivelVenda,
        })),
      };
    } catch (e) {
      log.error("buscar_produto failed", e, { workspaceId: ctx.workspaceId, termo });
      // IMPORTANTE: dizer ao modelo que NÃO adianta tentar de novo. Sem isso
      // ele entra em loop de tool calls e estoura MAX_TOOL_ROUNDS.
      return {
        erro: "estoque_indisponivel",
        permanente: true,
        mensagem:
          "A integração com o estoque está temporariamente indisponível. " +
          "Não tente buscar produtos novamente nesta conversa. " +
          "Responda ao cliente normalmente sem dados de estoque, " +
          "ou ofereça transferir para um vendedor humano.",
      };
    }
  }

  if (name === "calcular_obra") {
    const tipo = String(args.tipo ?? "");
    try {
      switch (tipo) {
        case "contrapiso":
          return contrapiso(Number(args.areaM2), args.espessuraCm ? Number(args.espessuraCm) : undefined);
        case "alvenaria":
          return alvenaria(Number(args.comprimentoM), Number(args.alturaM));
        case "reboco":
          return reboco(
            Number(args.areaM2),
            args.espessuraCm ? Number(args.espessuraCm) : undefined,
            args.lados ? Number(args.lados) : undefined
          );
        case "telhado":
          return telhado(Number(args.areaM2), (args.tipoTelha as "ceramica" | "fibrocimento") ?? "ceramica");
        case "pintura":
          return pintura(Number(args.areaM2), args.demaos ? Number(args.demaos) : undefined);
        case "concreto":
          return concreto(Number(args.volumeM3));
        case "aco":
          return aco(
            (args.elemento as "viga" | "pilar" | "laje") ?? "viga",
            Number(args.quantidadeM),
            args.bitolaMm ? Number(args.bitolaMm) : undefined
          );
        default:
          return { erro: `tipo desconhecido: ${tipo}` };
      }
    } catch (e) {
      log.error("calcular_obra failed", e, { tipo });
      return { erro: "parâmetros inválidos pro cálculo" };
    }
  }

  return { erro: `ferramenta desconhecida: ${name}` };
}

export type GenerateReplyInput = {
  workspaceId: string;
  conversationId: string;
};

export type GenerateReplyResult =
  | { ok: true; reply: string; rounds: number }
  | { ok: false; reason: "not-configured" | "disabled" | "no-content" | "error"; error?: string };

/**
 * Gera uma resposta da IA pra próxima mensagem da conversa.
 * Persiste tool calls/results em Message; quem chamar é responsável por enviar
 * a resposta final via Evolution.
 */
export async function generateReply(input: GenerateReplyInput): Promise<GenerateReplyResult> {
  const cfg = await getAgentConfig(input.workspaceId);

  if (!cfg.enabled) return { ok: false, reason: "disabled" };
  if (!cfg.apiKey) return { ok: false, reason: "not-configured" };

  const client = new OpenAI({ apiKey: cfg.apiKey });
  const systemPrompt = resolveSystemPrompt(cfg);

  const recent = await prisma.message.findMany({
    where: { conversationId: input.conversationId },
    orderBy: { createdAt: "desc" },
    take: MAX_HISTORY,
    select: { role: true, direction: true, content: true, toolCalls: true, toolCallId: true },
  });
  recent.reverse();

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...recent.map((m): ChatCompletionMessageParam => {
      if (m.role === "tool") {
        return { role: "tool", tool_call_id: m.toolCallId ?? "", content: m.content };
      }
      if (m.role === "assistant" && m.toolCalls) {
        return {
          role: "assistant",
          content: m.content || null,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tool_calls: m.toolCalls as any,
        };
      }
      return {
        role: m.role === "user" ? "user" : "assistant",
        content: m.content,
      };
    }),
  ];

  let promptTokensTotal = 0;
  let completionTokensTotal = 0;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    // No último round, removemos tools pra FORÇAR o modelo a gerar texto final
    // (caso contrário ele poderia ficar pedindo tool calls indefinidamente).
    const isLastRound = round === MAX_TOOL_ROUNDS - 1;

    let response;
    try {
      response = await client.chat.completions.create({
        model: cfg.model,
        max_tokens: MAX_TOKENS_PER_RESPONSE,
        messages,
        ...(isLastRound ? {} : { tools: TOOLS }),
      });
    } catch (e) {
      log.error("openai call failed", e, { workspaceId: input.workspaceId, round });
      return { ok: false, reason: "error", error: "OpenAI indisponível" };
    }

    promptTokensTotal += response.usage?.prompt_tokens ?? 0;
    completionTokensTotal += response.usage?.completion_tokens ?? 0;

    const choice = response.choices[0]?.message;
    if (!choice) return { ok: false, reason: "no-content" };

    if (choice.tool_calls && choice.tool_calls.length > 0) {
      await prisma.message.create({
        data: {
          conversationId: input.conversationId,
          role: "assistant",
          direction: "outbound",
          type: "text",
          status: "sent",
          content: choice.content ?? "",
          toolCalls: JSON.parse(JSON.stringify(choice.tool_calls)),
        },
      });
      messages.push({
        role: "assistant",
        content: choice.content ?? null,
        tool_calls: choice.tool_calls,
      });

      for (const call of choice.tool_calls) {
        if (call.type !== "function") continue;
        const args = safeParseJson(call.function.arguments);
        const result = await executeTool(call.function.name, args, {
          workspaceId: input.workspaceId,
        });
        const resultStr = JSON.stringify(result);

        await prisma.message.create({
          data: {
            conversationId: input.conversationId,
            role: "tool",
            direction: "outbound",
            type: "text",
            content: resultStr,
            toolCallId: call.id,
          },
        });
        messages.push({ role: "tool", tool_call_id: call.id, content: resultStr });
      }
      continue;
    }

    const finalText = choice.content?.trim() ?? "";
    if (!finalText) return { ok: false, reason: "no-content" };

    await incrementTokenUsage(input.workspaceId, promptTokensTotal, completionTokensTotal);
    log.info("reply generated", {
      workspaceId: input.workspaceId,
      conversationId: input.conversationId,
      rounds: round + 1,
      promptTokens: promptTokensTotal,
      completionTokens: completionTokensTotal,
    });
    return { ok: true, reply: finalText, rounds: round + 1 };
  }

  // Caso teórico: passou de todos os rounds (incluindo o último sem tools) sem
  // gerar texto. Manda fallback amigável em vez de silenciar o cliente.
  log.warn("max tool rounds reached — sending fallback", {
    workspaceId: input.workspaceId,
    conversationId: input.conversationId,
    promptTokens: promptTokensTotal,
    completionTokens: completionTokensTotal,
  });
  await incrementTokenUsage(input.workspaceId, promptTokensTotal, completionTokensTotal);
  return { ok: true, reply: FALLBACK_REPLY, rounds: MAX_TOOL_ROUNDS };
}

function safeParseJson(s: string): Record<string, unknown> {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}
