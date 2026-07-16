import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import type { Prisma } from "@/generated/prisma/client";

const log = logger("audit");

export type AuditAction =
  | "user.create"
  | "user.delete"
  | "user.update_role"
  | "user.password_change"
  | "user.reset_password"
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
 * Registra um evento de auditoria. Nunca lança - se o write falhar,
 * só logamos no console (não pode quebrar a action que chamou).
 */
export async function audit(input: AuditInput): Promise<void> {
  try {
    const h = await headers();
    // S2-02: x-real-ip (Vercel infra) > último de x-forwarded-for.
    // Leftmost de XFF é controlado pelo cliente.
    const real = h.get("x-real-ip");
    const xff = h.get("x-forwarded-for");
    let ip: string | null = null;
    if (real) ip = real.trim();
    else if (xff) {
      const parts = xff.split(",").map((s) => s.trim()).filter(Boolean);
      ip = parts[parts.length - 1] ?? null;
    }
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
    log.error("write failed", e, { action: input.action, target: input.target });
  }
}
