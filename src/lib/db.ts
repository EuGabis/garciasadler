import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function makeClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? makeClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Reexecuta uma operação Prisma quando a conexão Postgres cai de forma transitória
 * ("Connection terminated unexpectedly", ECONNRESET, etc.). Comum em serverless:
 * a função congela entre chamadas, a conexão do pool morre, e a próxima query falha.
 * O retry pega uma conexão nova e normalmente passa.
 */
export async function withDbRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const msg = (e as Error)?.message ?? "";
      const transient =
        /connection terminated|ECONNRESET|connection.*(closed|reset)|terminated unexpectedly|can't reach database|server has gone away|ETIMEDOUT|Closed/i.test(
          msg
        );
      if (!transient || i === attempts - 1) throw e;
      await new Promise((r) => setTimeout(r, 200 * (i + 1)));
    }
  }
  throw lastErr;
}
