import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authConfig } from "@/auth.config";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

/**
 * S2-03: hash dummy pra rodar bcrypt mesmo quando usuário não existe.
 * Evita timing attack que enumera emails (bcrypt leva ~200ms; sem isso
 * a diferença entre user existente e inexistente é detectável remotamente).
 */
const DUMMY_HASH = "$2a$12$CwTycUXWue0Thq9StjUM0uJ8K8XfRbXc9wQjhTRkjQq8H2Ax4Ssoa";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });

        // SEMPRE roda bcrypt — mesmo sem user — pra equalizar timing
        const hash = user?.password ?? DUMMY_HASH;
        const ok = await bcrypt.compare(parsed.data.password, hash);
        if (!user || !user.password || !ok) return null;

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          workspaceId: user.workspaceId,
          role: user.role,
          // S2-05: assinado no JWT pra invalidação após mudança de senha
          passwordChangedAt: user.passwordChangedAt?.getTime() ?? null,
        };
      },
    }),
  ],
});
