import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageSquare, Trash2 } from "lucide-react";
import { auth } from "@/auth";
import { getContact } from "@/lib/contacts";
import { formatPhone, formatRelativeTime } from "@/lib/format";
import { EditForm } from "./edit-form";
import { deleteContactAction } from "./actions";
import { SectionCard } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ContactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const contact = await getContact(session!.user.workspaceId, id);
  if (!contact) notFound();

  return (
    <div className="p-6 lg:p-10 max-w-3xl mx-auto text-stone-100">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/contatos"
          className="inline-flex items-center gap-1 text-xs uppercase tracking-wider text-stone-400 hover:text-brand-300 transition"
        >
          <ArrowLeft className="h-3 w-3" />
          Contatos
        </Link>
        <form
          action={async () => {
            "use server";
            await deleteContactAction(contact.id);
          }}
        >
          <button
            type="submit"
            className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2 py-1 rounded transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Excluir
          </button>
        </form>
      </div>

      <header className="flex items-center gap-4 mb-8">
        <div className="h-16 w-16 rounded-full gradient-brand text-white text-lg font-bold flex items-center justify-center shadow-brand-glow">
          {contact.name[0]?.toUpperCase() ?? "?"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-brand-300 mb-1">
            Contato
          </p>
          <h1 className="font-display text-3xl text-white tracking-tighter truncate">
            {contact.name}
          </h1>
          <p className="text-sm text-stone-400 mt-1">{formatPhone(contact.phone)}</p>
        </div>
      </header>

      <SectionCard title="Dados" className="mb-6">
        <EditForm
          contact={{
            id: contact.id,
            name: contact.name,
            phone: contact.phone,
            email: contact.email,
            productInterest: contact.productInterest,
            source: contact.source,
            notes: contact.notes,
            status: contact.status,
          }}
        />
      </SectionCard>

      <SectionCard title={`Conversas (${contact.conversations.length})`}>
        {contact.conversations.length === 0 ? (
          <p className="text-sm text-stone-400">Sem conversas ainda.</p>
        ) : (
          <ul className="divide-y divide-white/5 -mx-2">
            {contact.conversations.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/conversations/${c.id}`}
                  className="flex items-center gap-3 px-2 py-2.5 rounded hover:bg-white/[0.04] transition"
                >
                  <MessageSquare className="h-4 w-4 text-stone-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate text-stone-200">{c.lastMessage ?? "—"}</p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      <span className="capitalize">{c.status}</span> ·{" "}
                      {c.lastMessageAt ? formatRelativeTime(c.lastMessageAt) : "—"}
                      {c.unreadCount > 0 && ` · ${c.unreadCount} não lida(s)`}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
