import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const workspaces = await prisma.workspace.findMany({
    include: { _count: { select: { users: true, conversations: true, contacts: true } } },
  });
  console.log("Workspaces:");
  for (const w of workspaces) {
    console.log(`  - ${w.name} (slug=${w.slug}, id=${w.id})`);
    console.log(`    evolutionInstance: ${w.evolutionInstance ?? "<não setado>"}`);
    console.log(`    users=${w._count.users}, conversations=${w._count.conversations}, contacts=${w._count.contacts}`);
  }

  const users = await prisma.user.findMany({
    select: { email: true, name: true, role: true, workspace: { select: { name: true } } },
  });
  console.log("\nUsuários:");
  for (const u of users) {
    console.log(`  - ${u.name} <${u.email}> (${u.role}) em "${u.workspace.name}"`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
