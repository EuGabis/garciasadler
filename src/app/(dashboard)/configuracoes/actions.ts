"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { canManageTeam } from "@/lib/team";
import { encryptSecret, isEncryptedSecret } from "@/lib/secrets";
import { audit } from "@/lib/audit";

// Sentinel devolvido pela UI quando a chave NÃO foi alterada.
const KEY_UNCHANGED_SENTINEL = "__UNCHANGED__";

/**
 * Bloqueia URLs internas/privadas pra evitar SSRF via evolutionUrl.
 */
function isPrivateHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h === "0.0.0.0" || h === "[::]" || h === "::") return true;
  if (h.endsWith(".local") || h.endsWith(".internal")) return true;

  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(h);
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 0) return true;
    if (a >= 224) return true;
  }
  if (h.startsWith("[fe80") || h.startsWith("[::1") || h.startsWith("[fc") || h.startsWith("[fd")) {
    return true;
  }
  return false;
}

// ----- Workspace / Evolution -----

const evolutionSchema = z.object({
  evolutionUrl: z.string().url().or(z.literal("")),
  evolutionKey: z.string().max(500).or(z.literal("")),
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

  // SSRF guard
  if (parsed.data.evolutionUrl) {
    try {
      const url = new URL(parsed.data.evolutionUrl);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        return { error: "URL deve ser http:// ou https://." };
      }
      if (isPrivateHost(url.hostname)) {
        return { error: "URL aponta pra host interno/privado." };
      }
    } catch {
      return { error: "URL inválida." };
    }
  }

  const current = await prisma.workspace.findUnique({
    where: { id: session.user.workspaceId },
    select: { evolutionKey: true },
  });

  // Manipulação da key:
  //  - vazio  => limpar
  //  - sentinel => manter o existente
  //  - novo => criptografar
  let newEvolutionKey: string | null;
  if (!parsed.data.evolutionKey) {
    newEvolutionKey = null;
  } else if (parsed.data.evolutionKey === KEY_UNCHANGED_SENTINEL) {
    newEvolutionKey = current?.evolutionKey ?? null;
  } else {
    newEvolutionKey = isEncryptedSecret(parsed.data.evolutionKey)
      ? parsed.data.evolutionKey
      : encryptSecret(parsed.data.evolutionKey);
  }

  await prisma.workspace.update({
    where: { id: session.user.workspaceId },
    data: {
      name: parsed.data.workspaceName,
      evolutionUrl: parsed.data.evolutionUrl || null,
      evolutionKey: newEvolutionKey,
      evolutionInstance: parsed.data.evolutionInstance || null,
    },
  });

  const keyChanged =
    newEvolutionKey !== (current?.evolutionKey ?? null) && parsed.data.evolutionKey !== KEY_UNCHANGED_SENTINEL;
  await audit({
    workspaceId: session.user.workspaceId,
    userId: session.user.id,
    action: keyChanged ? "workspace.evolution_key_change" : "workspace.update",
    target: session.user.workspaceId,
    meta: {
      name: parsed.data.workspaceName,
      hasEvolutionConfig: !!newEvolutionKey,
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

  await audit({
    workspaceId: session.user.workspaceId,
    userId: session.user.id,
    action: "user.password_change",
    target: session.user.id,
  });

  return { ok: true };
}
