"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { signIn } from "@/auth";

const schema = z.object({
  workspaceName: z.string().min(2).max(80),
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export type RegisterState = { error?: string } | null;

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export async function registerAction(
  _prev: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  // Defense in depth: a page já bloqueia, mas o action também
  // recusa se o registro público estiver desativado.
  if (process.env.ENABLE_PUBLIC_REGISTRATION !== "true") {
    return { error: "Registro público desativado." };
  }

  const parsed = schema.safeParse({
    workspaceName: formData.get("workspaceName"),
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Dados inválidos. Verifique os campos." };
  }

  const { workspaceName, name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // S2-04: não revelar que o email existe (enumeração).
    return { error: "Não foi possível concluir o registro. Tente outro email." };
  }

  const baseSlug = slugify(workspaceName) || "workspace";
  let slug = baseSlug;
  let n = 1;
  while (await prisma.workspace.findUnique({ where: { slug } })) {
    n += 1;
    slug = `${baseSlug}-${n}`;
  }

  const passwordHash = await hashPassword(password);

  await prisma.$transaction(async (tx) => {
    const workspace = await tx.workspace.create({
      data: { name: workspaceName, slug },
    });
    await tx.user.create({
      data: {
        workspaceId: workspace.id,
        name,
        email,
        password: passwordHash,
        role: "owner",
      },
    });
  });

  await signIn("credentials", { email, password, redirect: false });
  redirect("/dashboard");
}
