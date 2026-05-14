import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const WORKSPACE_NAME = "Garcia Sadler";
  const WORKSPACE_SLUG = "garcia-sadler";

  const OWNER_EMAIL = "owner@example.com";
  const OWNER_NAME = "Gabriel Pereira";
  const OWNER_PASSWORD = "***REDACTED***";

  const EVOLUTION_URL = process.env.EVOLUTION_API_URL ?? "";
  const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY ?? "";
  const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE ?? "";

  const existing = await prisma.workspace.findUnique({ where: { slug: WORKSPACE_SLUG } });
  if (existing) {
    await prisma.workspace.update({
      where: { id: existing.id },
      data: {
        name: WORKSPACE_NAME,
        evolutionUrl: EVOLUTION_URL,
        evolutionKey: EVOLUTION_KEY,
        evolutionInstance: EVOLUTION_INSTANCE,
      },
    });
    console.log(`Workspace existente atualizado: ${existing.id}`);
  } else {
    const w = await prisma.workspace.create({
      data: {
        name: WORKSPACE_NAME,
        slug: WORKSPACE_SLUG,
        evolutionUrl: EVOLUTION_URL,
        evolutionKey: EVOLUTION_KEY,
        evolutionInstance: EVOLUTION_INSTANCE,
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

  console.log("\nSetup completo. Use estas credenciais pra logar:");
  console.log(`  email: ${OWNER_EMAIL}`);
  console.log(`  senha: ${OWNER_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
