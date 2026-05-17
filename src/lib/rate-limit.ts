import { prisma } from "@/lib/db";

export type RateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterSec: number };

/**
 * Token-bucket simples persistido no Postgres.
 * Usa o modelo `RateLimit` (id=key, attempts, resetAt).
 *
 * @param key   identificador único (ex: `login:${email}:${ip}` ou `webhook:${ip}`)
 * @param max   tentativas permitidas dentro da janela
 * @param windowSec janela em segundos
 */
export async function checkRateLimit(
  key: string,
  max: number,
  windowSec: number
): Promise<RateLimitResult> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowSec * 1000);

  // Upsert atômico: cria com 1 attempt OU incrementa se ainda na janela.
  const existing = await prisma.rateLimit.findUnique({ where: { key } });

  if (!existing || existing.resetAt <= now) {
    await prisma.rateLimit.upsert({
      where: { key },
      update: { attempts: 1, resetAt },
      create: { key, attempts: 1, resetAt },
    });
    return { ok: true, remaining: max - 1 };
  }

  if (existing.attempts >= max) {
    const retryAfterSec = Math.max(1, Math.ceil((existing.resetAt.getTime() - now.getTime()) / 1000));
    return { ok: false, retryAfterSec };
  }

  await prisma.rateLimit.update({
    where: { key },
    data: { attempts: { increment: 1 } },
  });

  return { ok: true, remaining: max - existing.attempts - 1 };
}

/** Reseta o contador (uso típico: após login bem-sucedido). */
export async function resetRateLimit(key: string): Promise<void> {
  await prisma.rateLimit.deleteMany({ where: { key } });
}

/**
 * IP do cliente resistente a spoofing (S2-02).
 *
 * - Vercel/Edge popula `x-real-ip` server-side: confiável.
 * - `x-forwarded-for` é controlado pelo cliente na posição LEFTMOST.
 *   Por isso, no fallback, pegamos o ÚLTIMO valor (mais próximo do edge).
 */
export function clientIpFrom(headers: Headers): string {
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((s) => s.trim()).filter(Boolean);
    return parts[parts.length - 1] ?? "unknown";
  }
  return "unknown";
}
