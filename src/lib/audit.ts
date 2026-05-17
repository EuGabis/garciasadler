import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

export type AuditAction =
  | "user.create"
  | "user.delete"
  | "user.update_role"
  | "user.password_change"
  | "workspace.update"
  | "workspace.evolution_key_change"
  | "automation.create"
  | "automation.update"
  | "automation.delete"
  | "followup.create"
  | "followup.update"
  | "followup.delete"
  | "contact.delete"
  | "session.login"
  | "session.logout";

type AuditInput = {
  workspaceId?: string | null;
  userId?: string | null;
  action: AuditAction;
  target?: string;
  meta?: Record<string, unknown>;
};

/**
 * Registra um evento de auditoria. Nunca lança — se o write falhar,
 * só logamos no console (não pode quebrar a action que chamou).
 */
export async function audit(input: AuditInput): Promise<void> {
  try {
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null;
    const ua = h.get("user-agent")?.slice(0, 400) ?? null;

    await prisma.auditLog.create({
      data: {
        workspaceId: input.workspaceId ?? null,
        userId: input.userId ?? null,
        action: input.action,
        target: input.target ?? null,
        meta: (input.meta as Prisma.InputJsonValue | undefined) ?? undefined,
        ip,
        userAgent: ua,
      },
    });
  } catch (e) {
    console.error("[audit] failed:", input.action, e);
  }
}
