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
      <p className="text-sm text-stone-500">
        Textos prontos pra usar em conversas. Acesse no chat clicando no botão{" "}
        <span className="font-medium">Rápidas</span>.
      </p>

      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden">
        <CreateReplyForm />
        {replies.length === 0 ? (
          <div className="p-12 text-center text-sm text-stone-500">
            Sem respostas rápidas. Crie a primeira acima.
          </div>
        ) : (
          <ul className="divide-y divide-stone-100 dark:divide-stone-800">
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
