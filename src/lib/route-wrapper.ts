import type { NextRequest } from "next/server";
import { logger, newRequestId, type Logger } from "@/lib/logger";

type RouteHandler = (req: NextRequest, ctx?: unknown) => Promise<Response>;

type WithErrorLoggingOptions = {
  scope: string;
};

/**
 * Wrapa um Route Handler do Next pra:
 * - Atribuir requestId
 * - Capturar exceptions e logar/persistir no ErrorLog
 * - Retornar 500 genérico (não vaza stack pro cliente)
 *
 * Uso:
 *   export const POST = withErrorLogging({ scope: "api/foo" })(async (req) => {
 *     ...
 *   });
 */
export function withErrorLogging(opts: WithErrorLoggingOptions) {
  return function wrap(handler: (req: NextRequest, log: Logger, ctx?: unknown) => Promise<Response>): RouteHandler {
    return async (req, ctx) => {
      const reqId = newRequestId();
      const log = logger(opts.scope, {
        reqId,
        url: req.nextUrl.pathname,
        ip:
          req.headers.get("x-real-ip") ??
          (req.headers.get("x-forwarded-for") ?? "").split(",").pop()?.trim() ??
          null,
      });

      try {
        return await handler(req, log, ctx);
      } catch (e) {
        log.fatal("unhandled exception", e);
        return Response.json(
          { ok: false, error: "internal error", requestId: reqId },
          { status: 500 }
        );
      }
    };
  };
}
