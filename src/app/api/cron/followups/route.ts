import { NextRequest } from "next/server";
import { runFollowUps } from "@/lib/followups";
import { logger, newRequestId } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  return handle(req);
}

export async function GET(req: NextRequest) {
  return handle(req);
}

async function handle(req: NextRequest) {
  const reqId = newRequestId();
  const log = logger("cron/followups", { reqId });

  const expected = process.env.CRON_SECRET;
  if (!expected) {
    log.error("CRON_SECRET não configurada - recusando request");
    return Response.json(
      { ok: false, error: "cron secret not configured" },
      { status: 503 }
    );
  }
  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${expected}`) {
    log.warn("unauthorized cron attempt", {
      ip: req.headers.get("x-forwarded-for") ?? null,
    });
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();
  try {
    log.info("cron starting");
    const result = await runFollowUps();
    const durationMs = Date.now() - startedAt;
    log.info("cron completed", { durationMs, ...result });
    return Response.json({ ok: true, durationMs, ...result });
  } catch (e) {
    log.fatal("cron fatal", e);
    return Response.json({ ok: false, error: "internal error" }, { status: 500 });
  }
}
