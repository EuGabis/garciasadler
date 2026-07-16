"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { canManageTeam } from "@/lib/team";
import { audit } from "@/lib/audit";

const createSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.enum(["owner", "admin", "agent"]),
});

const updateRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["owner", "admin", "agent"]),
});

export type TeamState = { error?: string; ok?: boolean } | null;

export async function createUserAction(
  _prev: TeamState,
  formData: FormData
): Promise<TeamState> {
  const session = await auth();
  if (!session?.user) return { error: "Não autenticado." };
  if (!canManageTeam(session.user.role)) return { error: "Sem permissão." };

  const parsed = createSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { error: "Dados inválidos." };

  // RBAC: só owner pode criar admin/owner. Admin só cria agent.
  if (
    (parsed.data.role === "owner" || parsed.data.role === "admin") &&
    session.user.role !== "owner"
  ) {
    return { error: "Só owner pode criar admin ou outro owner." };
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return { error: "Já existe usuário com esse email." };

  const passwordHash = await hashPassword(parsed.data.password);

  const created = await prisma.user.create({
    data: {
      workspaceId: session.user.workspaceId,
      name: parsed.data.name,
      email: parsed.data.email,
      password: passwordHash,
      role: parsed.data.role,
    },
  });

  await audit({
    workspaceId: session.user.workspaceId,
    userId: session.user.id,
    action: "user.create",
    target: created.id,
    meta: { email: parsed.data.email, role: parsed.data.role },
  });

  revalidatePath("/equipe");
  return { ok: true };
}

export async function updateRoleAction(
  _prev: TeamState,
  formData: FormData
): Promise<TeamState> {
  const session = await auth();
  if (!session?.user) return { error: "Não autenticado." };
  if (!canManageTeam(session.user.role)) return { error: "Sem permissão." };

  const parsed = updateRoleSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { error: "Dados inválidos." };

  const target = await prisma.user.findFirst({
    where: { id: parsed.data.userId, workspaceId: session.user.workspaceId },
  });
  if (!target) return { error: "Usuário não encontrado." };

  // RBAC: só owner pode mexer em owner OU promover pra admin/owner.
  if (
    (parsed.data.role === "owner" ||
      parsed.data.role === "admin" ||
      target.role === "owner") &&
    session.user.role !== "owner"
  ) {
    return { error: "Só owner pode promover pra admin/owner ou mexer em owner." };
  }

  // Não pode rebaixar o último owner
  if (target.role === "owner" && parsed.data.role !== "owner") {
    const owners = await prisma.user.count({
      where: { workspaceId: session.user.workspaceId, role: "owner" },
    });
    if (owners <= 1) return { error: "Workspace precisa ter pelo menos um owner." };
  }

  await prisma.user.update({
    where: { id: target.id },
    data: { role: parsed.data.role },
  });

  await audit({
    workspaceId: session.user.workspaceId,
    userId: session.user.id,
    action: "user.update_role",
    target: target.id,
    meta: { from: target.role, to: parsed.data.role, email: target.email },
  });

  revalidatePath("/equipe");
  return { ok: true };
}

const resetPasswordSchema = z.object({
  userId: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

export async function resetPasswordAction(
  _prev: TeamState,
  formData: FormData
): Promise<TeamState> {
  const session = await auth();
  if (!session?.user) return { error: "Não autenticado." };
  if (!canManageTeam(session.user.role)) return { error: "Sem permissão." };

  const parsed = resetPasswordSchema.safeParse({
    userId: formData.get("userId"),
    newPassword: formData.get("newPassword"),
  });
  if (!parsed.success) return { error: "Senha precisa ter pelo menos 8 caracteres." };

  if (parsed.data.userId === session.user.id) {
    return { error: "Use a aba Conta pra trocar sua própria senha." };
  }

  const target = await prisma.user.findFirst({
    where: { id: parsed.data.userId, workspaceId: session.user.workspaceId },
  });
  if (!target) return { error: "Usuário não encontrado." };

  // RBAC: só owner pode resetar senha de outro owner
  if (target.role === "owner" && session.user.role !== "owner") {
    return { error: "Só owner pode resetar senha de outro owner." };
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);

  await prisma.user.update({
    where: { id: target.id },
    data: {
      password: passwordHash,
      // Invalida sessões antigas dele - JWT carrega passwordChangedAt
      passwordChangedAt: new Date(),
    },
  });

  await audit({
    workspaceId: session.user.workspaceId,
    userId: session.user.id,
    action: "user.reset_password",
    target: target.id,
    meta: { email: target.email, role: target.role },
  });

  revalidatePath("/equipe");
  return { ok: true };
}

export async function deleteUserAction(userId: string): Promise<TeamState> {
  const session = await auth();
  if (!session?.user) return { error: "Não autenticado." };
  if (!canManageTeam(session.user.role)) return { error: "Sem permissão." };
  if (userId === session.user.id) return { error: "Você não pode excluir você mesmo." };

  const target = await prisma.user.findFirst({
    where: { id: userId, workspaceId: session.user.workspaceId },
  });
  if (!target) return { error: "Usuário não encontrado." };

  if (target.role === "owner") {
    const owners = await prisma.user.count({
      where: { workspaceId: session.user.workspaceId, role: "owner" },
    });
    if (owners <= 1) return { error: "Não pode excluir o único owner." };
    if (session.user.role !== "owner") {
      return { error: "Só owner pode excluir owner." };
    }
  }

  await prisma.user.delete({ where: { id: userId } });

  await audit({
    workspaceId: session.user.workspaceId,
    userId: session.user.id,
    action: "user.delete",
    target: target.id,
    meta: { email: target.email, role: target.role },
  });

  revalidatePath("/equipe");
  return { ok: true };
}
