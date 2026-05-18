"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import OpenAI from "openai";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { canManageTeam } from "@/lib/team";
import { encryptSecret, isEncryptedSecret } from "@/lib/secrets";
import { audit } from "@/lib/audit";
import { logger } from "@/lib/logger";
import { decryptSecret } from "@/lib/secrets";

const log = logger("ai-actions");

const KEY_UNCHANGED_SENTINEL = "__UNCHANGED__";

const schema = z.object({
  enabled: z.boolean(),
  systemPrompt: z.string().max(50000).nullable(),
  model: z.enum(["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini", "gpt-4.1"]),
  apiKey: z.string().max(500),
});

export type AiConfigState = { error?: string; ok?: boolean } | null;

export async function saveAiConfigAction(
  _prev: AiConfigState,
  formData: FormData
): Promise<AiConfigState> {
  const session = await auth();
  if (!session?.user) return { error: "Não autenticado." };
  if (!canManageTeam(session.user.role)) return { error: "Sem permissão." };

  const parsed = schema.safeParse({
    enabled: formData.get("enabled") === "on" || formData.get("enabled") === "true",
    systemPrompt: ((formData.get("systemPrompt") as string) || "").trim() || null,
    model: formData.get("model"),
    apiKey: (formData.get("apiKey") as string) ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const current = await prisma.agentConfig.findUnique({
    where: { workspaceId: session.user.workspaceId },
    select: { apiKey: true },
  });

  let newKey: string | null;
  if (!parsed.data.apiKey) {
    newKey = null;
  } else if (parsed.data.apiKey === KEY_UNCHANGED_SENTINEL) {
    newKey = current?.apiKey ?? null;
  } else {
    newKey = isEncryptedSecret(parsed.data.apiKey)
      ? parsed.data.apiKey
      : encryptSecret(parsed.data.apiKey);
  }

  if (parsed.data.enabled && !newKey) {
    return { error: "Pra ativar a IA, informe uma chave OpenAI." };
  }

  await prisma.agentConfig.upsert({
    where: { workspaceId: session.user.workspaceId },
    create: {
      workspaceId: session.user.workspaceId,
      enabled: parsed.data.enabled,
      systemPrompt: parsed.data.systemPrompt,
      model: parsed.data.model,
      apiKey: newKey,
    },
    update: {
      enabled: parsed.data.enabled,
      systemPrompt: parsed.data.systemPrompt,
      model: parsed.data.model,
      apiKey: newKey,
    },
  });

  await audit({
    workspaceId: session.user.workspaceId,
    userId: session.user.id,
    action: "workspace.update",
    target: "agent-config",
    meta: { enabled: parsed.data.enabled, model: parsed.data.model },
  });

  revalidatePath("/configuracoes");
  return { ok: true };
}

export async function testOpenAiAction(): Promise<{ ok?: boolean; error?: string; model?: string }> {
  const session = await auth();
  if (!session?.user) return { error: "Não autenticado." };
  if (!canManageTeam(session.user.role)) return { error: "Sem permissão." };

  const cfg = await prisma.agentConfig.findUnique({
    where: { workspaceId: session.user.workspaceId },
    select: { apiKey: true, model: true },
  });
  if (!cfg?.apiKey) return { error: "API key não configurada." };

  const apiKey = decryptSecret(cfg.apiKey);
  if (!apiKey) return { error: "Não foi possível ler a chave." };

  try {
    const client = new OpenAI({ apiKey });
    const r = await client.chat.completions.create({
      model: cfg.model,
      max_tokens: 10,
      messages: [{ role: "user", content: "Diga 'ok'." }],
    });
    return { ok: true, model: r.model };
  } catch (e) {
    log.error("openai test failed", e);
    return { error: "Falha ao conectar com OpenAI. Verifique a chave." };
  }
}

export async function resetMonthlyTokensAction(): Promise<{ ok?: boolean }> {
  const session = await auth();
  if (!session?.user || !canManageTeam(session.user.role)) return {};
  await prisma.agentConfig.updateMany({
    where: { workspaceId: session.user.workspaceId },
    data: { tokensUsedMonth: 0, tokensResetAt: new Date() },
  });
  revalidatePath("/configuracoes");
  return { ok: true };
}
