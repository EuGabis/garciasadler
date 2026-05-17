import { auth } from "@/auth";
import { listTeam, canManageTeam } from "@/lib/team";
import { TeamList } from "../equipe/team-list";

export async function EquipeTab() {
  const session = await auth();
  const members = await listTeam(session!.user.workspaceId);

  return (
    <div className="space-y-4">
      <p className="text-sm text-stone-400">Quem pode acessar o workspace e atender conversas.</p>

      <TeamList
        members={members}
        currentUser={{ id: session!.user.id, role: session!.user.role }}
        canManage={canManageTeam(session!.user.role)}
      />
    </div>
  );
}
