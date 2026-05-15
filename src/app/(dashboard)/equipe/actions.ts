"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { canManageTeam } from "@/lib/team";

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

  // Só owner pode criar owner
  if (parsed.data.role === "owner" && session.user.role !== "owner") {
    return { error: "Só owner pode criar outro owner." };
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return { error: "Já existe usuário com esse email." };

  const passwordHash = await hashPassword(parsed.data.password);

  await prisma.user.create({
    data: {
      workspaceId: session.user.workspaceId,
      name: parsed.data.name,
      email: parsed.data.email,
      password: passwordHash,
      role: parsed.data.role,
    },
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

  // Só owner pode promover/rebaixar pra/de owner
  if ((parsed.data.role === "owner" || target.role === "owner") && session.user.role !== "owner") {
    return { error: "Só owner pode mexer em owner." };
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
  revalidatePath("/equipe");
  return { ok: true };
}
