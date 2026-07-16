/**
 * Persistência de errors no DB de forma resiliente:
 * - Não bloqueia o código que logou (fire-and-forget).
 * - Trunca campos grandes (stack, context).
 * - Falha silenciosa: se o write falhar, só imprime no console.
 *   Nunca propaga pro chamador (evita loop infinito).
 * - Importação tardia do prisma pra evitar ciclos com `lib/db.ts`.
 */
import type { Prisma } from "@/generated/prisma/client";

const MAX_STACK_BYTES = 5_000;
const MAX_MESSAGE_BYTES = 2_000;

export type PersistedError = {
  level: "error" | "fatal" | "warn";
  scope: string;
  message: string;
  errorName?: string | null;
  stack?: string | null;
  context?: Record<string, unknown> | null;
  requestId?: string | null;
  workspaceId?: string | null;
  userId?: string | null;
  url?: string | null;
  ip?: string | null;
};

function truncate(s: string | null | undefined, max: number): string | null {
  if (!s) return null;
  if (s.length <= max) return s;
  return s.slice(0, max - 16) + "…[truncated]";
}

/**
 * Persiste um erro no banco. Nunca lança.
 *
 * Usa import dinâmico do prisma pra não criar ciclo (logger.ts é importado
 * em muitos lugares, inclusive db.ts).
 */
export async function persistError(input: PersistedError): Promise<void> {
  try {
    const { prisma } = await import("@/lib/db");

    await prisma.errorLog.create({
      data: {
        level: input.level,
        scope: input.scope,
        message: truncate(input.message, MAX_MESSAGE_BYTES) ?? "(empty)",
        errorName: input.errorName ?? null,
        stack: truncate(input.stack, MAX_STACK_BYTES),
        context: (input.context as Prisma.InputJsonValue | undefined) ?? undefined,
        requestId: input.requestId ?? null,
        workspaceId: input.workspaceId ?? null,
        userId: input.userId ?? null,
        url: input.url ?? null,
        ip: input.ip ?? null,
      },
    });
  } catch (e) {
    // Falha silenciosa - não pode quebrar quem chamou.
    // Imprime cru pra Vercel logs ainda capturarem.
    // eslint-disable-next-line no-console
    console.error("[error-store] persist failed", e instanceof Error ? e.message : e);
  }
}
