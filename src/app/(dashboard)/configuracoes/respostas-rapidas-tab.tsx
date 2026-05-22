import { Sparkles } from "lucide-react";
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
      <p className="text-[13px] text-stone-500">
        Textos prontos para usar em conversas. Acesse no chat clicando no botão{" "}
        <span className="font-medium text-stone-700 dark:text-stone-300">Rápidas</span>.
      </p>

      <div className="rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-stone-900 overflow-hidden">
        <CreateReplyForm />
        {replies.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto h-10 w-10 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-3">
              <Sparkles className="h-4 w-4 text-stone-400" />
            </div>
            <p className="text-[13px] font-medium text-stone-700 dark:text-stone-300">
              Sem respostas rápidas
            </p>
            <p className="text-[12px] text-stone-500 mt-1">Crie a primeira acima.</p>
          </div>
        ) : (
          <ul className="divide-y divide-stone-100 dark:divide-stone-800/60">
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
