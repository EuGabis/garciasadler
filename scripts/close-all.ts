import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  if (process.env.CONFIRM !== "yes") {
    console.error(
      "[close-all] Esse script arquiva TODAS as conversas abertas/pendentes do banco.\n" +
        "Pra confirmar, rode com:\n  CONFIRM=yes npm run db:close-all\n"
    );
    process.exit(1);
  }

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
