import { prisma } from "@/lib/db";
import type { UserRole } from "@/generated/prisma/client";

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  color: string | null;
  isOnline: boolean;
  lastLoginAt: Date | null;
  assignedCount: number;
};

export async function listTeam(workspaceId: string): Promise<TeamMember[]> {
  const users = await prisma.user.findMany({
    where: { workspaceId },
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      color: true,
      isOnline: true,
      lastLoginAt: true,
      _count: { select: { assignments: true } },
    },
  });

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    color: u.color,
    isOnline: u.isOnline,
    lastLoginAt: u.lastLoginAt,
    assignedCount: u._count.assignments,
  }));
}

export function canManageTeam(role: UserRole): boolean {
  return role === "owner" || role === "admin";
}
