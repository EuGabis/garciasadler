import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Tag } from "lucide-react";
import { LabelRow, CreateLabelForm } from "./label-row";

export const dynamic = "force-dynamic";

export default async function LabelsPage() {
  const session = await auth();
  const workspaceId = session!.user.workspaceId;

  const labels = await prisma.label.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      color: true,
      _count: { select: { conversations: true } },
    },
  });

  return (
    <div className="p-6 lg:p-10 max-w-3xl mx-auto">
      <header className="mb-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
            Etiquetas
          </h1>
          <p className="mt-1 text-[13px] text-stone-500">
            Organize conversas com tags coloridas.
          </p>
        </div>
        <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-md bg-stone-100 dark:bg-stone-800 text-[12px] font-medium tabular-nums text-stone-600 dark:text-stone-400">
          {labels.length}
        </span>
      </header>

      <div className="rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-stone-900 overflow-hidden">
        <CreateLabelForm />
        {labels.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto h-10 w-10 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-3">
              <Tag className="h-4 w-4 text-stone-400" />
            </div>
            <p className="text-[13px] font-medium text-stone-700 dark:text-stone-300">
              Sem etiquetas ainda
            </p>
            <p className="text-[12px] text-stone-500 mt-1">
              Crie a primeira acima.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-stone-100 dark:divide-stone-800/60">
            {labels.map((l) => (
              <li key={l.id}>
                <LabelRow
                  label={{
                    id: l.id,
                    name: l.name,
                    color: l.color,
                    conversationCount: l._count.conversations,
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
