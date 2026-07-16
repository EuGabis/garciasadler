"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  Phone,
  ShoppingBag,
  Compass,
  StickyNote,
  ExternalLink,
  Check,
  X,
  PanelRightClose,
  PanelRightOpen,
  MessageSquare,
  Calendar,
  Info,
} from "lucide-react";
import { updateContactFieldAction } from "./contact-actions";
import { formatPhone, formatRelativeTime } from "@/lib/format";
import { avatarColor, avatarInitial } from "@/lib/avatar-color";

type Contact = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  productInterest: string | null;
  source: string | null;
  status: "active" | "archived" | "blocked";
  createdAt: Date;
};

type RelatedConversation = {
  id: string;
  status: string;
  lastMessage: string | null;
  lastMessageAt: Date | null;
};

const statusOptions: Array<{ value: Contact["status"]; label: string; cls: string }> = [
  {
    value: "active",
    label: "Ativo",
    cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 ring-emerald-200/60 dark:ring-emerald-500/20",
  },
  {
    value: "archived",
    label: "Arquivado",
    cls: "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 ring-stone-200/60 dark:ring-stone-700",
  },
  {
    value: "blocked",
    label: "Bloqueado",
    cls: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 ring-red-200/60 dark:ring-red-500/20",
  },
];

export function ContactPanel({
  contact,
  conversationId: _conversationId,
  otherConversations,
}: {
  contact: Contact;
  conversationId: string;
  otherConversations: RelatedConversation[];
}) {
  const [open, setOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const [, startTransition] = useTransition();

  useEffect(() => {
    const v = window.localStorage.getItem("contact_panel_open");
    if (v !== null) setOpen(v === "1");
  }, []);

  // Trava scroll quando drawer mobile está aberto
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [mobileOpen]);

  function toggle() {
    setOpen((v) => {
      window.localStorage.setItem("contact_panel_open", v ? "0" : "1");
      return !v;
    });
  }

  const heroAvatar = avatarColor(contact.name);

  function setStatus(s: Contact["status"]) {
    startTransition(async () => {
      const fd = new FormData();
      fd.append("contactId", contact.id);
      fd.append("field", "status");
      fd.append("value", s);
      await updateContactFieldAction(null, fd);
      router.refresh();
    });
  }

  const panelBody = (
    <>
      <div className="flex-1 overflow-y-auto">
        {/* Hero */}
        <div className="px-5 pt-6 pb-5 text-center border-b border-stone-200/80 dark:border-stone-800/80">
          <div
            className={`mx-auto h-16 w-16 rounded-full ring-1 text-xl font-semibold flex items-center justify-center mb-3 ${heroAvatar.bg} ${heroAvatar.text} ${heroAvatar.ring}`}
          >
            {avatarInitial(contact.name)}
          </div>
          <InlineText
            value={contact.name}
            contactId={contact.id}
            field="name"
            className="text-[15px] font-semibold text-stone-900 dark:text-stone-50 tracking-tight"
            singleLine
            required
          />
          <p className="mt-1.5 text-[12px] text-stone-500 flex items-center justify-center gap-1.5 tabular-nums">
            <Phone className="h-3 w-3" />
            {formatPhone(contact.phone)}
          </p>
        </div>

        {/* Status */}
        <section className="px-5 py-4 border-b border-stone-200/80 dark:border-stone-800/80">
          <FieldLabel>Status</FieldLabel>
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {statusOptions.map((s) => {
              const active = contact.status === s.value;
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStatus(s.value)}
                  className={`px-2 py-1.5 rounded-md text-[11px] font-medium ring-1 transition ${
                    active
                      ? s.cls
                      : "ring-stone-200 dark:ring-stone-800 text-stone-500 hover:bg-stone-50 dark:hover:bg-stone-800/50 hover:text-stone-700 dark:hover:text-stone-300"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Dados */}
        <section className="px-5 py-4 border-b border-stone-200/80 dark:border-stone-800/80 space-y-4">
          <Field icon={Mail} label="E-mail">
            <InlineText
              value={contact.email}
              contactId={contact.id}
              field="email"
              placeholder="adicionar e-mail"
              singleLine
            />
          </Field>

          <Field icon={ShoppingBag} label="Produto de interesse">
            <InlineText
              value={contact.productInterest}
              contactId={contact.id}
              field="productInterest"
              placeholder="ex: cimento, areia"
              singleLine
            />
          </Field>

          <Field icon={Compass} label="Origem">
            <InlineText
              value={contact.source}
              contactId={contact.id}
              field="source"
              placeholder="ex: indicação"
              singleLine
            />
          </Field>

          <Field icon={Calendar} label="Cliente desde">
            <p className="text-[12.5px] text-stone-700 dark:text-stone-300 px-2 py-1.5">
              {contact.createdAt.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </Field>
        </section>

        {/* Notas */}
        <section className="px-5 py-4 border-b border-stone-200/80 dark:border-stone-800/80">
          <FieldLabel>
            <span className="inline-flex items-center gap-1.5">
              <StickyNote className="h-3 w-3" /> Notas internas
            </span>
          </FieldLabel>
          <InlineText
            value={contact.notes}
            contactId={contact.id}
            field="notes"
            placeholder="Visíveis só pra equipe…"
            multiline
          />
        </section>

        {/* Conversas relacionadas */}
        <section className="px-5 py-4">
          <FieldLabel>Outras conversas ({otherConversations.length})</FieldLabel>
          {otherConversations.length === 0 ? (
            <p className="mt-2 text-[12px] text-stone-500">
              Nenhuma outra conversa com este contato.
            </p>
          ) : (
            <ul className="mt-2 space-y-1">
              {otherConversations.slice(0, 5).map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/conversations/${c.id}`}
                    className="block px-2.5 py-2 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800/60 transition"
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <MessageSquare className="h-3 w-3 text-stone-400 shrink-0" />
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-stone-500">
                        {c.status}
                      </span>
                      <span className="text-[10px] text-stone-500 ml-auto tabular-nums">
                        {formatRelativeTime(c.lastMessageAt)}
                      </span>
                    </div>
                    <p className="text-[12px] text-stone-700 dark:text-stone-300 truncate">
                      {c.lastMessage ?? "-"}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <footer className="px-5 py-3 border-t border-stone-200/80 dark:border-stone-800/80">
        <Link
          href={`/contatos/${contact.id}`}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/60 hover:text-stone-900 dark:hover:text-stone-50 transition"
        >
          Ver perfil completo
          <ExternalLink className="h-3 w-3" />
        </Link>
      </footer>
    </>
  );

  return (
    <>
      {/* Mobile: floating trigger (visível só em <lg) */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed bottom-24 right-4 z-30 p-3 rounded-full bg-brand-600 text-white shadow-lg shadow-brand-600/30 hover:bg-brand-700 active:scale-95 transition"
        aria-label="Abrir perfil do contato"
      >
        <Info className="h-5 w-5" />
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            aria-label="Fechar painel"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-stone-900/50 dark:bg-black/60"
          />
          <aside className="relative w-[320px] max-w-[85vw] h-full bg-white dark:bg-stone-900 flex flex-col shadow-2xl animate-slide-in-right">
            <header className="px-5 py-3.5 border-b border-stone-200/80 dark:border-stone-800/80 flex items-center justify-between">
              <h3 className="text-[11px] uppercase tracking-[0.08em] font-semibold text-stone-500">
                Perfil do contato
              </h3>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition"
                title="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </header>
            {panelBody}
          </aside>
        </div>
      )}

      {/* Desktop: collapsed trigger */}
      {!open && (
        <button
          type="button"
          onClick={toggle}
          className="hidden lg:block absolute right-4 top-4 z-10 p-2 rounded-lg bg-white dark:bg-stone-900 ring-1 ring-stone-200 dark:ring-stone-800 text-stone-600 dark:text-stone-300 hover:text-brand-600 dark:hover:text-brand-400 hover:ring-stone-300 dark:hover:ring-stone-700 transition shadow-sm"
          title="Abrir painel do contato"
        >
          <PanelRightOpen className="h-4 w-4" />
        </button>
      )}

      {/* Desktop sidebar */}
      {open && (
        <aside className="hidden lg:flex w-[320px] shrink-0 border-l border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-stone-900 flex-col animate-slide-in-right">
          <header className="px-5 py-3.5 border-b border-stone-200/80 dark:border-stone-800/80 flex items-center justify-between">
            <h3 className="text-[11px] uppercase tracking-[0.08em] font-semibold text-stone-500">
              Perfil do contato
            </h3>
            <button
              type="button"
              onClick={toggle}
              className="p-1 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition"
              title="Recolher painel"
            >
              <PanelRightClose className="h-4 w-4" />
            </button>
          </header>
          {panelBody}
        </aside>
      )}
    </>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-stone-500">
      {children}
    </span>
  );
}

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-stone-500 flex items-center gap-1.5 mb-1">
        <Icon className="h-3 w-3" />
        {label}
      </span>
      {children}
    </div>
  );
}

function InlineText({
  value,
  contactId,
  field,
  placeholder,
  singleLine: _singleLine,
  multiline,
  required,
  className,
}: {
  value: string | null;
  contactId: string;
  field: "name" | "notes" | "productInterest" | "source" | "email";
  placeholder?: string;
  singleLine?: boolean;
  multiline?: boolean;
  required?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const [draft, setDraft] = useState(value ?? "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(value ?? "");
  }, [value]);

  function save() {
    setError(null);
    if (required && !draft.trim()) {
      setError("Obrigatório.");
      return;
    }
    if (draft === (value ?? "")) {
      setEditing(false);
      return;
    }
    startTransition(async () => {
      const fd = new FormData();
      fd.append("contactId", contactId);
      fd.append("field", field);
      fd.append("value", draft);
      const r = await updateContactFieldAction(null, fd);
      if (r?.error) {
        setError(r.error);
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  function cancel() {
    setDraft(value ?? "");
    setEditing(false);
    setError(null);
  }

  if (editing) {
    return (
      <div className="mt-1">
        <div className="flex items-start gap-1">
          {multiline ? (
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
              rows={3}
              maxLength={2000}
              className="flex-1 rounded-md border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-2.5 py-1.5 text-[12px] text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 resize-none"
              placeholder={placeholder}
            />
          ) : (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
              maxLength={200}
              onKeyDown={(e) => {
                if (e.key === "Enter") save();
                if (e.key === "Escape") cancel();
              }}
              className={`flex-1 rounded-md border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-2.5 py-1.5 text-[12px] text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 ${className ?? ""}`}
              placeholder={placeholder}
            />
          )}
          <div className="flex flex-col gap-0.5 shrink-0">
            <button
              type="button"
              onClick={save}
              disabled={pending}
              className="p-1 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 disabled:opacity-50"
              title="Salvar (Enter)"
            >
              <Check className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={cancel}
              className="p-1 rounded text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
              title="Cancelar (Esc)"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
        {error && <p className="mt-1 text-[10px] text-red-600">{error}</p>}
      </div>
    );
  }

  const display = value && value.trim() ? value : null;

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="mt-1 w-full text-left rounded-md px-2 py-1.5 hover:bg-stone-50 dark:hover:bg-stone-800/60 transition"
    >
      {display ? (
        <p
          className={`text-[12.5px] text-stone-700 dark:text-stone-200 ${
            multiline ? "whitespace-pre-wrap" : "truncate"
          } ${className ?? ""}`}
        >
          {display}
        </p>
      ) : (
        <p className="text-[12px] text-stone-400 dark:text-stone-500 italic">
          {placeholder ?? "-"}
        </p>
      )}
    </button>
  );
}
