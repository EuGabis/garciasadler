import { prisma } from "@/lib/db";
import { ReplyRow, CreateReplyForm } from "../respostas-rapidas/reply-row";

export async function RespostasRapidasTab({ workspaceId }: { workspaceId: string }) {
  const replies = await prisma.quickReply.findMany({
    where: { workspaceId },
    orderBy: { title: "asc" },
    select: { id: true, title: true, content: true },
  });

  return (
    <div className="space-y-4">
      <p className="text-sm text-stone-400">
        Textos prontos pra usar em conversas. Acesse no chat clicando no botão{" "}
        <span className="font-medium text-stone-200">Rápidas</span>.
      </p>

      <div className="rounded-2xl glass overflow-hidden">
        <CreateReplyForm />
        {replies.length === 0 ? (
          <div className="p-12 text-center text-sm text-stone-400">
            Sem respostas rápidas. Crie a primeira acima.
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            {replies.map((r) => (
              <li key={r.id}>
                <ReplyRow reply={r} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
