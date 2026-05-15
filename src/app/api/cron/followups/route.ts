import { NextRequest } from "next/server";
import { runFollowUps } from "@/lib/followups";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Endpoint disparado pelo Vercel Cron uma vez por dia (Hobby plan).
 *
 * Autenticação (fail-closed):
 * - Exige header `Authorization: Bearer ${CRON_SECRET}`.
 * - Sem `CRON_SECRET` setado nas env vars, retorna 503 (não 200) pra
 *   garantir que o endpoint nunca processa sem autenticação.
 * - O Vercel Cron envia o header automaticamente quando a env var existe.
 *
 * Documentação: https://vercel.com/docs/cron-jobs
 */
export async function POST(req: NextRequest) {
  return handle(req);
}

export async function GET(req: NextRequest) {
  return handle(req);
}

async function handle(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    console.error("[cron/followups] CRON_SECRET não configurada — recusando request");
    return Response.json(
      { ok: false, error: "cron secret not configured" },
      { status: 503 }
    );
  }
  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${expected}`) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();
  try {
    const result = await runFollowUps();
    const durationMs = Date.now() - startedAt;
    return Response.json({ ok: true, durationMs, ...result });
  } catch (e) {
    console.error("[cron/followups] fatal:", e);
    return Response.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
