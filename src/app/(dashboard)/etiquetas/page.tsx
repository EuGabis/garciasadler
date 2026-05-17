import { auth } from "@/auth";
import { prisma } from "@/lib/db";
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
    <div className="p-8 max-w-3xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Etiquetas</h1>
        <p className="mt-1 text-sm text-stone-500">
          Organize conversas com tags coloridas.
        </p>
      </header>

      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden">
        <CreateLabelForm />
        {labels.length === 0 ? (
          <div className="p-12 text-center text-sm text-stone-500">
            Sem etiquetas ainda. Crie a primeira acima.
          </div>
        ) : (
          <ul className="divide-y divide-stone-100 dark:divide-stone-800">
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
