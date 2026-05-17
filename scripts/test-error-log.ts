/**
 * Gera 3 erros de teste pra validar o pipeline:
 * logger → emit → import dinâmico → persistError → DB.
 */
import "dotenv/config";
import { logger } from "../src/lib/logger";

async function main() {
  const log = logger("test:smoke");

  log.error("Erro de teste — verifique se aparece em Configurações → Logs", {
    workspaceId: "cmp4vcukx00006ckhq9k8v1ys",
    sample: { value: 42, items: ["a", "b", "c"] },
  });

  try {
    JSON.parse("isso não é JSON");
  } catch (e) {
    log.error("Capturei um SyntaxError de propósito", e, {
      workspaceId: "cmp4vcukx00006ckhq9k8v1ys",
    });
  }

  log.warn("Warning de teste — esse NÃO vai pro DB (apenas error/fatal persistem)", {
    workspaceId: "cmp4vcukx00006ckhq9k8v1ys",
  });

  // Persist é fire-and-forget. Espera um pouco antes do processo terminar.
  await new Promise((r) => setTimeout(r, 2000));

  // Verifica no DB
  const { PrismaPg } = await import("@prisma/adapter-pg");
  const { PrismaClient } = await import("../src/generated/prisma/client");
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });
  const count = await prisma.errorLog.count({ where: { scope: "test:smoke" } });
  console.log(`\n✓ ErrorLog gravados com scope="test:smoke": ${count}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
