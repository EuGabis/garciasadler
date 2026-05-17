/**
 * Logger estruturado.
 *
 * - Em produção: emite uma linha JSON por log (Vercel/Logflare parseiam).
 * - Em dev: emite formatado pra leitura.
 * - **Redaction**: chaves sensíveis (password, secret, key, token, authorization, apikey,
 *   evolution_key, encryption_key, cron_secret) são mascaradas recursivamente.
 *
 * Uso:
 *   const log = logger("webhook");
 *   log.info("received", { instance: payload.instance });
 *   log.error("send failed", err, { phone });
 */

type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  fatal: 50,
};

const SENSITIVE_PATTERN = /^(.*_)?(password|secret|key|token|authorization|apikey|cookie|session|bearer)(_.*)?$/i;

const isProd = process.env.NODE_ENV === "production";
const minLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) ?? (isProd ? "info" : "debug");

function shouldLog(level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[minLevel];
}

function maskValue(v: string): string {
  if (v.length <= 8) return "***";
  return `${v.slice(0, 4)}***${v.slice(-2)}`;
}

function redact(value: unknown, depth = 0): unknown {
  if (depth > 6) return "[depth-limit]";
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack?.split("\n").slice(0, 8).join("\n"),
    };
  }
  if (Buffer.isBuffer?.(value as Buffer)) return `[Buffer ${(value as Buffer).length}b]`;
  if (Array.isArray(value)) {
    if (value.length > 50) return [...value.slice(0, 50).map((v) => redact(v, depth + 1)), `[+${value.length - 50} more]`];
    return value.map((v) => redact(v, depth + 1));
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_PATTERN.test(k)) {
        out[k] = typeof v === "string" ? maskValue(v) : "***";
        continue;
      }
      // Strings muito longas viram truncated (ex: mediaBase64)
      if (typeof v === "string" && v.length > 500) {
        out[k] = `${v.slice(0, 80)}…[+${v.length - 80}chars]`;
        continue;
      }
      out[k] = redact(v, depth + 1);
    }
    return out;
  }
  return String(value);
}

type Context = Record<string, unknown>;

function emit(level: LogLevel, scope: string, msg: string, data?: Context) {
  if (!shouldLog(level)) return;

  const safeData = data ? (redact(data) as Context) : undefined;
  const entry = {
    ts: new Date().toISOString(),
    level,
    scope,
    msg,
    ...(safeData ?? {}),
  };

  if (isProd) {
    // Vercel logs parseiam JSON
    const out = JSON.stringify(entry);
    if (level === "error" || level === "fatal") console.error(out);
    else if (level === "warn") console.warn(out);
    else console.log(out);
    return;
  }

  // Dev: linha legível
  const tag = `[${level.toUpperCase()}] [${scope}]`;
  const tail = safeData && Object.keys(safeData).length ? safeData : "";
  if (level === "error" || level === "fatal") console.error(tag, msg, tail);
  else if (level === "warn") console.warn(tag, msg, tail);
  else console.log(tag, msg, tail);
}

export type Logger = {
  debug: (msg: string, data?: Context) => void;
  info: (msg: string, data?: Context) => void;
  warn: (msg: string, data?: Context) => void;
  error: (msg: string, error?: unknown, data?: Context) => void;
  fatal: (msg: string, error?: unknown, data?: Context) => void;
  child: (additionalScope: string, additionalContext?: Context) => Logger;
};

function createLogger(scope: string, baseContext: Context = {}): Logger {
  return {
    debug: (msg, data) => emit("debug", scope, msg, { ...baseContext, ...data }),
    info: (msg, data) => emit("info", scope, msg, { ...baseContext, ...data }),
    warn: (msg, data) => emit("warn", scope, msg, { ...baseContext, ...data }),
    error: (msg, error, data) =>
      emit("error", scope, msg, { ...baseContext, ...data, error: error instanceof Error ? error : error ? String(error) : undefined }),
    fatal: (msg, error, data) =>
      emit("fatal", scope, msg, { ...baseContext, ...data, error: error instanceof Error ? error : error ? String(error) : undefined }),
    child: (additionalScope, additionalContext) =>
      createLogger(`${scope}:${additionalScope}`, { ...baseContext, ...(additionalContext ?? {}) }),
  };
}

export function logger(scope: string, context?: Context): Logger {
  return createLogger(scope, context);
}

/**
 * Gera um requestId curto (8 chars) pra correlacionar logs de um único request.
 */
export function newRequestId(): string {
  return Math.random().toString(36).slice(2, 10);
}
