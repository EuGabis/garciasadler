// Camada de IA — desativada na Fase 1.
// Será religada na Fase 9 (AgentConfig por workspace + tool use).
// Mantida no codebase como esqueleto pronto pra plugar quando chegar a hora.

import OpenAI from "openai";
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/chat/completions";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db";
import { buscarProduto, listarPorCategoria } from "@/lib/produtos";

const DEFAULT_SYSTEM = `Você é o atendente virtual da Garcia Sadler Materiais de Construção.
Atenda em português brasileiro, cordial e objetivo.
Use as ferramentas pra consultar produtos antes de dar preço/estoque. Nunca invente valores.`;

const TOOLS: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "buscar_produto",
      description: "Consulta um produto pelo SKU ou nome. Retorna preço, estoque, unidade.",
      parameters: {
        type: "object",
        properties: { termo: { type: "string", description: "SKU ou parte do nome" } },
        required: ["termo"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "listar_por_categoria",
      description: "Lista produtos por categoria.",
      parameters: {
        type: "object",
        properties: { categoria: { type: "string" } },
        required: ["categoria"],
      },
    },
  },
];

async function executeTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case "buscar_produto":
      return await buscarProduto(String(args.termo ?? ""));
    case "listar_por_categoria":
      return await listarPorCategoria(String(args.categoria ?? ""));
    default:
      return { erro: `Ferramenta desconhecida: ${name}` };
  }
}

const MAX_HISTORY = 20;
const MAX_TOOL_ROUNDS = 5;

export async function generateReply(conversationId: string, systemPrompt?: string): Promise<string> {
  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY não configurada");
  }
  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

  const history = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: MAX_HISTORY,
  });
  history.reverse();

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt ?? DEFAULT_SYSTEM },
    ...history.map((m): ChatCompletionMessageParam => {
      if (m.role === "tool") {
        return {
          role: "tool",
          tool_call_id: m.toolCallId ?? "",
          content: m.content,
        };
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

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await client.chat.completions.create({
      model: env.OPENAI_MODEL,
      max_tokens: 500,
      messages,
      tools: TOOLS,
    });

    const choice = response.choices[0]?.message;
    if (!choice) throw new Error("OpenAI não retornou resposta");

    if (choice.tool_calls && choice.tool_calls.length > 0) {
      await prisma.message.create({
        data: {
          conversationId,
          role: "assistant",
          direction: "outbound",
          type: "text",
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
        const result = await executeTool(call.function.name, args);
        const resultStr = JSON.stringify(result);

        await prisma.message.create({
          data: {
            conversationId,
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
    await prisma.message.create({
      data: {
        conversationId,
        role: "assistant",
        direction: "outbound",
        type: "text",
        content: finalText,
      },
    });
    return finalText;
  }

  return "";
}

function safeParseJson(s: string): Record<string, unknown> {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}
