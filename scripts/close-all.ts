import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const r = await prisma.conversation.updateMany({
    where: { status: { in: ["open", "pending"] } },
    data: { status: "archived", unreadCount: 0 },
  });
  console.log(`Arquivadas ${r.count} conversas. Próximas mensagens recriam conversations abertas.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
