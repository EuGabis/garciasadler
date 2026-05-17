import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { LabelRow, CreateLabelForm } from "./label-row";
import { PageHeader, SectionCard } from "@/components/ui";

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
    <div className="p-6 lg:p-10 max-w-3xl mx-auto text-stone-100">
      <PageHeader
        eyebrow="Organização"
        title="Etiquetas"
        description="Organize conversas com tags coloridas."
      />

      <SectionCard noPadding>
        <CreateLabelForm />
        {labels.length === 0 ? (
          <div className="p-12 text-center text-sm text-stone-400">
            Sem etiquetas ainda. Crie a primeira acima.
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
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
      </SectionCard>
    </div>
  );
}
