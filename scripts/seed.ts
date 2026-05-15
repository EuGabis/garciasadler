import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

function readEnv(name: string): string {
  const v = process.env[name];
  if (!v || v.trim().length === 0) {
    console.error(
      `\n[seed] env var "${name}" ausente. Setá-la em .env.local antes de rodar.\n` +
        `Exemplo:\n  SEED_OWNER_EMAIL=...\n  SEED_OWNER_PASSWORD=...\n  SEED_OWNER_NAME=...\n`
    );
    process.exit(1);
  }
  return v.trim();
}

async function main() {
  const WORKSPACE_NAME = process.env.SEED_WORKSPACE_NAME ?? "Garcia Sadler";
  const WORKSPACE_SLUG = process.env.SEED_WORKSPACE_SLUG ?? "garcia-sadler";

  const OWNER_EMAIL = readEnv("SEED_OWNER_EMAIL");
  const OWNER_NAME = readEnv("SEED_OWNER_NAME");
  const OWNER_PASSWORD = readEnv("SEED_OWNER_PASSWORD");

  if (OWNER_PASSWORD.length < 8) {
    console.error("[seed] SEED_OWNER_PASSWORD precisa ter ao menos 8 caracteres.");
    process.exit(1);
  }

  const EVOLUTION_URL = process.env.EVOLUTION_API_URL ?? "";
  const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY ?? "";
  const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE ?? "";

  const existing = await prisma.workspace.findUnique({ where: { slug: WORKSPACE_SLUG } });
  if (existing) {
    await prisma.workspace.update({
      where: { id: existing.id },
      data: {
        name: WORKSPACE_NAME,
        evolutionUrl: EVOLUTION_URL || null,
        evolutionKey: EVOLUTION_KEY || null,
        evolutionInstance: EVOLUTION_INSTANCE || null,
      },
    });
    console.log(`Workspace existente atualizado: ${existing.id}`);
  } else {
    const w = await prisma.workspace.create({
      data: {
        name: WORKSPACE_NAME,
        slug: WORKSPACE_SLUG,
        evolutionUrl: EVOLUTION_URL || null,
        evolutionKey: EVOLUTION_KEY || null,
        evolutionInstance: EVOLUTION_INSTANCE || null,
      },
    });
    console.log(`Workspace criado: ${w.id}`);
  }

  const workspace = await prisma.workspace.findUnique({ where: { slug: WORKSPACE_SLUG } });
  if (!workspace) throw new Error("Workspace não foi criado.");

  const userExists = await prisma.user.findUnique({ where: { email: OWNER_EMAIL } });
  const passwordHash = await bcrypt.hash(OWNER_PASSWORD, 12);

  if (userExists) {
    await prisma.user.update({
      where: { id: userExists.id },
      data: {
        workspaceId: workspace.id,
        name: OWNER_NAME,
        password: passwordHash,
        role: "owner",
      },
    });
    console.log(`Owner atualizado: ${OWNER_EMAIL}`);
  } else {
    await prisma.user.create({
      data: {
        workspaceId: workspace.id,
        name: OWNER_NAME,
        email: OWNER_EMAIL,
        password: passwordHash,
        role: "owner",
      },
    });
    console.log(`Owner criado: ${OWNER_EMAIL}`);
  }

  console.log(`\nSetup completo. Login: ${OWNER_EMAIL}`);
  console.log("(Senha foi lida de env e NÃO é ecoada aqui.)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
