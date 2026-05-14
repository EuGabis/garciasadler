import OpenAI from "openai";
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/chat/completions";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db";
import { buscarProduto, listarPorCategoria } from "@/lib/produtos";

const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `Você é o atendente virtual da Garcia Materiais de Construção, uma loja física que vende cimento, areia, brita, tijolos, blocos, hidráulica, elétrica e pintura.

Diretrizes:
- Atenda em português brasileiro, de forma cordial, objetiva e profissional.
- Quando o cliente perguntar sobre preço, estoque, disponibilidade ou características de um produto específico, SEMPRE use a ferramenta "buscar_produto" antes de responder. Nunca invente valores.
- Quando o cliente pedir opções de uma categoria (ex: "que tipos de tijolo vocês têm"), use "listar_por_categoria".
- Se a ferramenta retornar erro, peça mais detalhes ao cliente (nome correto, SKU, marca).
- Não invente prazo de entrega, frete, formas de pagamento ou promoções que não estejam nos dados.
- Se o cliente pedir algo que você não tem dados pra confirmar, ofereça transferir pra um atendente humano.
- Respostas curtas e diretas. Sem floreios. Quando listar produtos, mostre nome, preço e unidade.`;

const TOOLS: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "buscar_produto",
      description:
        "Consulta um produto específico pelo SKU ou nome. Retorna preço, estoque, unidade e descrição.",
      parameters: {
        type: "object",
        properties: {
          termo: {
            type: "string",
            description: "SKU exato (ex: CIM-50) ou parte do nome do produto (ex: cimento)",
          },
        },
        required: ["termo"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "listar_por_categoria",
      description:
        "Lista todos os produtos de uma categoria (ex: Cimento, Agregados, Cerâmica, Hidráulica, Elétrica, Pintura).",
      parameters: {
        type: "object",
        properties: {
          categoria: { type: "string", description: "Nome da categoria" },
        },
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

export async function generateReply(conversationId: string, userText: string): Promise<string> {
  await prisma.message.create({
    data: { conversationId, role: "user", content: userText },
  });

  const history = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: MAX_HISTORY,
  });
  history.reverse();

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
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
        role: m.role as "user" | "assistant" | "system",
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
      data: { conversationId, role: "assistant", content: finalText },
    });
    return finalText;
  }

  const fallback =
    "Desculpe, não consegui processar sua solicitação agora. Pode reformular ou tentar de novo daqui a pouco?";
  await prisma.message.create({
    data: { conversationId, role: "assistant", content: fallback },
  });
  return fallback;
}

function safeParseJson(s: string): Record<string, unknown> {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}
