"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const schema = z.object({
  name: z.string().min(1).max(80),
  enabled: z.boolean(),
  triggerType: z.enum(["first_message", "keyword"]),
  keywords: z.array(z.string().min(1).max(80)).max(20),
  assignUserId: z.string().nullable(),
  pipelineColumnId: z.string().nullable(),
  addLabelName: z.string().max(40).nullable(),
  replyMessage: z.string().max(2000).nullable(),
});

const createSchema = schema;
const updateSchema = schema.extend({ id: z.string().min(1) });

export type AutomationState = { error?: string; ok?: boolean } | null;

type Input = z.infer<typeof schema>;

function parseInput(formData: FormData): { ok: true; data: Input } | { ok: false; error: string } {
  const raw = {
    name: String(formData.get("name") ?? ""),
    enabled: formData.get("enabled") === "true" || formData.get("enabled") === "on",
    triggerType: String(formData.get("triggerType") ?? "first_message"),
    keywords: String(formData.get("keywords") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    assignUserId: (formData.get("assignUserId") as string) || null,
    pipelineColumnId: (formData.get("pipelineColumnId") as string) || null,
    addLabelName: ((formData.get("addLabelName") as string) || "").trim() || null,
    replyMessage: ((formData.get("replyMessage") as string) || "").trim() || null,
  };
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
  }
  if (parsed.data.triggerType === "keyword" && parsed.data.keywords.length === 0) {
    return { ok: false, error: "Adicione ao menos 1 palavra-chave." };
  }
  return { ok: true, data: parsed.data };
}

/** H5: garante que IDs referenciados pertencem ao workspace do usuário. */
async function validateCrossWorkspaceIds(
  workspaceId: string,
  data: Input
): Promise<string | null> {
  if (data.assignUserId) {
    const u = await prisma.user.findFirst({
      where: { id: data.assignUserId, workspaceId },
      select: { id: true },
    });
    if (!u) return "Agente atribuído não pertence ao workspace.";
  }
  if (data.pipelineColumnId) {
    const c = await prisma.kanbanColumn.findFirst({
      where: { id: data.pipelineColumnId, workspaceId },
      select: { id: true },
    });
    if (!c) return "Coluna do pipeline não pertence ao workspace.";
  }
  return null;
}

export async function createAutomationAction(
  _prev: AutomationState,
  formData: FormData
): Promise<AutomationState> {
  const session = await auth();
  if (!session?.user) return { error: "Não autenticado." };

  const r = parseInput(formData);
  if (!r.ok) return { error: r.error };

  const xsErr = await validateCrossWorkspaceIds(session.user.workspaceId, r.data);
  if (xsErr) return { error: xsErr };

  await prisma.automation.create({
    data: {
      workspaceId: session.user.workspaceId,
      ...r.data,
    },
  });

  revalidatePath("/automacoes");
  return { ok: true };
}

export async function updateAutomationAction(
  _prev: AutomationState,
  formData: FormData
): Promise<AutomationState> {
  const session = await auth();
  if (!session?.user) return { error: "Não autenticado." };

  const id = String(formData.get("id") ?? "");
  const r = parseInput(formData);
  if (!r.ok) return { error: r.error };

  const exists = await prisma.automation.findFirst({
    where: { id, workspaceId: session.user.workspaceId },
  });
  if (!exists) return { error: "Automação não encontrada." };

  const validated = updateSchema.safeParse({ ...r.data, id });
  if (!validated.success) return { error: "Dados inválidos." };

  const xsErr = await validateCrossWorkspaceIds(session.user.workspaceId, r.data);
  if (xsErr) return { error: xsErr };

  await prisma.automation.update({
    where: { id },
    data: r.data,
  });

  revalidatePath("/automacoes");
  return { ok: true };
}

export async function toggleAutomationAction(id: string): Promise<void> {
  const session = await auth();
  if (!session?.user) return;
  const auto = await prisma.automation.findFirst({
    where: { id, workspaceId: session.user.workspaceId },
    select: { enabled: true },
  });
  if (!auto) return;
  await prisma.automation.update({
    where: { id },
    data: { enabled: !auto.enabled },
  });
  revalidatePath("/automacoes");
}

export async function deleteAutomationAction(id: string): Promise<void> {
  const session = await auth();
  if (!session?.user) return;
  await prisma.automation.deleteMany({
    where: { id, workspaceId: session.user.workspaceId },
  });
  revalidatePath("/automacoes");
}

// Marker pra type checker — evita warning de createSchema unused
export type _Create = z.infer<typeof createSchema>;
