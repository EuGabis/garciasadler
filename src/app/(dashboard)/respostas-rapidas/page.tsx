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
        <p className="mt-1 text-sm text-stone-500">
          Textos prontos pra usar em conversas. Acesse no chat clicando em &quot;rápidas&quot;.
        </p>
      </header>

      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden">
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
