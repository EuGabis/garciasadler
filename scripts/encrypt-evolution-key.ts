/**
 * Encripta o `workspace.evolutionKey` existente de cada workspace
 * usando AES-256-GCM (v1 com prefixo `enc:v1:`).
 *
 * Rode após setar INTEGRATION_ENCRYPTION_KEY no .env / Vercel.
 *
 * Uso: npm run db:encrypt-evolution-key
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { encryptSecret, isEncryptedSecret } from "../src/lib/secrets";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const workspaces = await prisma.workspace.findMany({
    where: { evolutionKey: { not: null } },
    select: { id: true, name: true, evolutionKey: true },
  });

  let migrated = 0;
  let alreadyEncrypted = 0;

  for (const w of workspaces) {
    if (!w.evolutionKey) continue;
    if (isEncryptedSecret(w.evolutionKey)) {
      alreadyEncrypted++;
      continue;
    }
    const enc = encryptSecret(w.evolutionKey);
    await prisma.workspace.update({
      where: { id: w.id },
      data: { evolutionKey: enc },
    });
    console.log(`Encriptado: ${w.name} (${w.id})`);
    migrated++;
  }

  console.log(`\nResultado:`);
  console.log(`  migrados: ${migrated}`);
  console.log(`  já encriptados (enc:v1:): ${alreadyEncrypted}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
