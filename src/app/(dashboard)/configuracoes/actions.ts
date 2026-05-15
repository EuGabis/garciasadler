"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { canManageTeam } from "@/lib/team";

// ----- Workspace / Evolution -----

const evolutionSchema = z.object({
  evolutionUrl: z.string().url().or(z.literal("")),
  evolutionKey: z.string().max(200).or(z.literal("")),
  evolutionInstance: z.string().max(100).or(z.literal("")),
  workspaceName: z.string().min(2).max(80),
});

export type WorkspaceState = { error?: string; ok?: boolean } | null;

export async function updateWorkspaceAction(
  _prev: WorkspaceState,
  formData: FormData
): Promise<WorkspaceState> {
  const session = await auth();
  if (!session?.user) return { error: "Não autenticado." };
  if (!canManageTeam(session.user.role)) return { error: "Sem permissão." };

  const parsed = evolutionSchema.safeParse({
    workspaceName: formData.get("workspaceName"),
    evolutionUrl: formData.get("evolutionUrl") ?? "",
    evolutionKey: formData.get("evolutionKey") ?? "",
    evolutionInstance: formData.get("evolutionInstance") ?? "",
  });
  if (!parsed.success) return { error: "Dados inválidos." };

  await prisma.workspace.update({
    where: { id: session.user.workspaceId },
    data: {
      name: parsed.data.workspaceName,
      evolutionUrl: parsed.data.evolutionUrl || null,
      evolutionKey: parsed.data.evolutionKey || null,
      evolutionInstance: parsed.data.evolutionInstance || null,
    },
  });

  revalidatePath("/configuracoes");
  return { ok: true };
}

// ----- Perfil + senha -----

const profileSchema = z.object({
  name: z.string().min(2).max(80),
});

export type ProfileState = { error?: string; ok?: boolean } | null;

export async function updateProfileAction(
  _prev: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const session = await auth();
  if (!session?.user) return { error: "Não autenticado." };

  const parsed = profileSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: "Nome inválido." };

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name: parsed.data.name },
  });

  revalidatePath("/configuracoes");
  return { ok: true };
}

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(128),
    confirmPassword: z.string().min(8).max(128),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export type PasswordState = { error?: string; ok?: boolean } | null;

export async function updatePasswordAction(
  _prev: PasswordState,
  formData: FormData
): Promise<PasswordState> {
  const session = await auth();
  if (!session?.user) return { error: "Não autenticado." };

  const parsed = passwordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  });
  if (!user?.password) return { error: "Usuário sem senha definida." };

  const valid = await verifyPassword(parsed.data.currentPassword, user.password);
  if (!valid) return { error: "Senha atual incorreta." };

  const newHash = await hashPassword(parsed.data.newPassword);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: newHash },
  });

  return { ok: true };
}
