import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { ReplyRow, CreateReplyForm } from "./reply-row";

export const dynamic = "force-dynamic";

export default async function QuickRepliesPage() {
  const session = await auth();
  const replies = await prisma.quickReply.findMany({
    where: { workspaceId: session!.user.workspaceId },
    orderBy: { title: "asc" },
    select: { id: true, title: true, content: true },
  });

  return (
    <div className="p-8 max-w-3xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Respostas rápidas</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Textos prontos pra usar em conversas. Acesse no chat clicando em &quot;rápidas&quot;.
        </p>
      </header>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
        <CreateReplyForm />
        {replies.length === 0 ? (
          <div className="p-12 text-center text-sm text-zinc-500">
            Sem respostas rápidas. Crie a primeira acima.
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
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
