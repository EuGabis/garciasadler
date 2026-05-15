import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageSquare, Trash2 } from "lucide-react";
import { auth } from "@/auth";
import { getContact } from "@/lib/contacts";
import { formatPhone, formatRelativeTime } from "@/lib/format";
import { EditForm } from "./edit-form";
import { deleteContactAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function ContactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const contact = await getContact(session!.user.workspaceId, id);
  if (!contact) notFound();

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/contatos"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition"
        >
          <ArrowLeft className="h-4 w-4" />
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
            className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 px-2 py-1 rounded transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Excluir
          </button>
        </form>
      </div>

      <header className="flex items-center gap-4 mb-8">
        <div className="h-14 w-14 rounded-full bg-brand-orange-500/10 dark:bg-brand-orange-500/20 text-brand-orange-700 dark:text-brand-orange-300 text-lg font-semibold flex items-center justify-center">
          {contact.name[0]?.toUpperCase() ?? "?"}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold tracking-tight truncate">{contact.name}</h1>
          <p className="text-sm text-slate-500">{formatPhone(contact.phone)}</p>
        </div>
      </header>

      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 mb-6">
        <h2 className="text-sm font-semibold mb-4">Dados</h2>
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
      </section>

      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <h2 className="text-sm font-semibold mb-3">Conversas ({contact.conversations.length})</h2>
        {contact.conversations.length === 0 ? (
          <p className="text-sm text-slate-500">Sem conversas ainda.</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800 -mx-2">
            {contact.conversations.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/conversations/${c.id}`}
                  className="flex items-center gap-3 px-2 py-2.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  <MessageSquare className="h-4 w-4 text-slate-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{c.lastMessage ?? "—"}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
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
      </section>
    </div>
  );
}
