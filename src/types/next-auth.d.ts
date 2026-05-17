import type { DefaultSession } from "next-auth";
import type { UserRole } from "@/generated/prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      workspaceId: string;
      role: UserRole;
    } & DefaultSession["user"];
  }

  interface User {
    workspaceId: string;
    role: UserRole;
    /** S2-05: ms epoch da última troca de senha (null se nunca trocada). */
    passwordChangedAt?: number | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    workspaceId: string;
    role: UserRole;
    passwordChangedAt?: number | null;
  }
}
