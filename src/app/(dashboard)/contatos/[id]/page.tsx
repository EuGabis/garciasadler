import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageSquare, Trash2 } from "lucide-react";
import { auth } from "@/auth";
import { getContact } from "@/lib/contacts";
import { formatPhone, formatRelativeTime } from "@/lib/format";
import { avatarColor, avatarInitial } from "@/lib/avatar-color";
import { EditForm } from "./edit-form";
import { deleteContactAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function ContactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const contact = await getContact(session!.user.workspaceId, id);
  if (!contact) notFound();

  const color = avatarColor(contact.name);

  return (
    <div className="p-6 lg:p-10 max-w-3xl mx-auto">
      {/* Breadcrumb + delete */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/contatos"
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar para contatos
        </Link>
        <form
          action={async () => {
            "use server";
            await deleteContactAction(contact.id);
          }}
        >
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-stone-500 hover:text-red-600 dark:hover:text-red-400 px-2.5 py-1 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Excluir
          </button>
        </form>
      </div>

      {/* Hero */}
      <header className="flex items-center gap-4 mb-8">
        <div
          className={`h-14 w-14 rounded-full ring-1 text-lg font-semibold flex items-center justify-center ${color.bg} ${color.text} ${color.ring}`}
        >
          {avatarInitial(contact.name)}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50 truncate">
            {contact.name}
          </h1>
          <p className="text-[13px] text-stone-500 tabular-nums mt-0.5">
            {formatPhone(contact.phone)}
          </p>
        </div>
      </header>

      {/* Dados */}
      <section className="rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-stone-900 mb-3">
        <header className="px-6 py-4 border-b border-stone-100 dark:border-stone-800/60">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-500">
            Dados do contato
          </h2>
        </header>
        <div className="p-6">
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
        </div>
      </section>

      {/* Conversas */}
      <section className="rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-stone-900">
        <header className="px-6 py-4 border-b border-stone-100 dark:border-stone-800/60 flex items-center justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-500">
            Conversas
          </h2>
          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-md bg-stone-100 dark:bg-stone-800 text-[11px] font-medium tabular-nums text-stone-600 dark:text-stone-400">
            {contact.conversations.length}
          </span>
        </header>
        {contact.conversations.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto h-9 w-9 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-2.5">
              <MessageSquare className="h-4 w-4 text-stone-400" />
            </div>
            <p className="text-[13px] text-stone-500">Sem conversas ainda.</p>
          </div>
        ) : (
          <ul className="divide-y divide-stone-100 dark:divide-stone-800/60">
            {contact.conversations.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/conversations/${c.id}`}
                  className="flex items-center gap-3 px-6 py-3 hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors"
                >
                  <MessageSquare className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-stone-700 dark:text-stone-200 truncate">
                      {c.lastMessage ?? "—"}
                    </p>
                    <p className="text-[11.5px] text-stone-500 mt-0.5 flex items-center gap-1.5">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                        {c.status}
                      </span>
                      <span>·</span>
                      <span className="tabular-nums">
                        {c.lastMessageAt ? formatRelativeTime(c.lastMessageAt) : "—"}
                      </span>
                      {c.unreadCount > 0 && (
                        <>
                          <span>·</span>
                          <span className="text-brand-600 font-medium">
                            {c.unreadCount} não lida(s)
                          </span>
                        </>
                      )}
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
