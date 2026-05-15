"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const schema = z.object({
  name: z.string().min(1).max(80),
  enabled: z.boolean(),
  triggerType: z.enum(["inactivity", "column_entry"]),
  inactivityHours: z.coerce.number().int().min(1).max(720).nullable(),
  columnId: z.string().nullable(),
  message: z.string().min(1).max(2000),
  transferToUserId: z.string().nullable(),
  maxTimes: z.coerce.number().int().min(1).max(10),
});

const updateSchema = schema.extend({ id: z.string().min(1) });

export type FollowUpState = { error?: string; ok?: boolean } | null;

function parseInput(formData: FormData) {
  const raw = {
    name: String(formData.get("name") ?? ""),
    enabled: formData.get("enabled") === "true" || formData.get("enabled") === "on",
    triggerType: String(formData.get("triggerType") ?? "inactivity"),
    inactivityHours: formData.get("inactivityHours") || null,
    columnId: (formData.get("columnId") as string) || null,
    message: String(formData.get("message") ?? ""),
    transferToUserId: (formData.get("transferToUserId") as string) || null,
    maxTimes: formData.get("maxTimes") || 1,
  };
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues.map((i) => i.message).join("; ") };
  }
  if (parsed.data.triggerType === "inactivity" && !parsed.data.inactivityHours) {
    return { ok: false as const, error: "Defina as horas de inatividade." };
  }
  if (parsed.data.triggerType === "column_entry" && !parsed.data.columnId) {
    return { ok: false as const, error: "Escolha a coluna do pipeline." };
  }
  return { ok: true as const, data: parsed.data };
}

export async function createFollowUpAction(
  _prev: FollowUpState,
  formData: FormData
): Promise<FollowUpState> {
  const session = await auth();
  if (!session?.user) return { error: "Não autenticado." };

  const r = parseInput(formData);
  if (!r.ok) return { error: r.error };

  await prisma.followUp.create({
    data: { workspaceId: session.user.workspaceId, ...r.data },
  });

  revalidatePath("/automacoes/followups");
  return { ok: true };
}

export async function updateFollowUpAction(
  _prev: FollowUpState,
  formData: FormData
): Promise<FollowUpState> {
  const session = await auth();
  if (!session?.user) return { error: "Não autenticado." };

  const id = String(formData.get("id") ?? "");
  const r = parseInput(formData);
  if (!r.ok) return { error: r.error };

  const validated = updateSchema.safeParse({ ...r.data, id });
  if (!validated.success) return { error: "Dados inválidos." };

  const exists = await prisma.followUp.findFirst({
    where: { id, workspaceId: session.user.workspaceId },
  });
  if (!exists) return { error: "Follow-up não encontrado." };

  await prisma.followUp.update({ where: { id }, data: r.data });

  revalidatePath("/automacoes/followups");
  return { ok: true };
}

export async function toggleFollowUpAction(id: string): Promise<void> {
  const session = await auth();
  if (!session?.user) return;
  const f = await prisma.followUp.findFirst({
    where: { id, workspaceId: session.user.workspaceId },
    select: { enabled: true },
  });
  if (!f) return;
  await prisma.followUp.update({ where: { id }, data: { enabled: !f.enabled } });
  revalidatePath("/automacoes/followups");
}

export async function deleteFollowUpAction(id: string): Promise<void> {
  const session = await auth();
  if (!session?.user) return;
  await prisma.followUp.deleteMany({
    where: { id, workspaceId: session.user.workspaceId },
  });
  revalidatePath("/automacoes/followups");
}
