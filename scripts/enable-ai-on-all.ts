/**
 * Liga aiEnabled=true em todas as conversas existentes.
 * Rode uma vez após habilitar a Sprint IA.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const r = await prisma.conversation.updateMany({
    where: { aiEnabled: false },
    data: { aiEnabled: true },
  });
  console.log(`Atualizadas ${r.count} conversas pra aiEnabled=true`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
