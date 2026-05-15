import { auth } from "@/auth";
import { listTeam, canManageTeam } from "@/lib/team";
import { TeamList } from "./team-list";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const session = await auth();
  const members = await listTeam(session!.user.workspaceId);

  return (
    <div className="p-8 max-w-3xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Equipe</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Quem pode acessar o workspace e atender conversas.
        </p>
      </header>

      <TeamList
        members={members}
        currentUser={{ id: session!.user.id, role: session!.user.role }}
        canManage={canManageTeam(session!.user.role)}
      />
    </div>
  );
}
