import { NextRequest } from "next/server";
import { runFollowUps } from "@/lib/followups";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Endpoint disparado pelo Vercel Cron a cada N minutos.
 *
 * Autenticação:
 * - O Vercel Cron envia automaticamente o header `Authorization: Bearer ${CRON_SECRET}`.
 * - Se `CRON_SECRET` estiver setado nas env vars, validamos. Senão, aceita (útil em dev).
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
  if (expected) {
    const auth = req.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${expected}`) {
      return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
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
