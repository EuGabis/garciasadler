import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

/**
 * Rotaciona a senha de um usuário existente.
 *
 * Uso:
 *   ROTATE_EMAIL=user@example.com ROTATE_NEW_PASSWORD='NovaSenha123' npm run db:rotate-password
 *
 * - Nunca aceita senha hardcoded. Sempre lê de env.
 * - Senha precisa ter pelo menos 8 caracteres.
 * - Não ecoa a senha em log.
 */

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

function readEnv(name: string): string {
  const v = process.env[name];
  if (!v || v.trim().length === 0) {
    console.error(`[rotate-password] env "${name}" obrigatória.`);
    process.exit(1);
  }
  return v.trim();
}

async function main() {
  const email = readEnv("ROTATE_EMAIL");
  const newPassword = readEnv("ROTATE_NEW_PASSWORD");

  if (newPassword.length < 8) {
    console.error("[rotate-password] senha precisa ter pelo menos 8 caracteres.");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`[rotate-password] usuário não encontrado: ${email}`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: passwordHash },
  });

  console.log(`OK — senha de ${email} rotacionada.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
