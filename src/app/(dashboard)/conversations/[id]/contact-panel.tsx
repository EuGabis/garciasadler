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
} from "lucide-react";
import { updateContactFieldAction } from "./contact-actions";
import { formatPhone, formatRelativeTime } from "@/lib/format";

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
    cls: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  },
  {
    value: "archived",
    label: "Arquivado",
    cls: "bg-white/[0.06] text-stone-300 ring-white/10",
  },
  {
    value: "blocked",
    label: "Bloqueado",
    cls: "bg-red-500/15 text-red-300 ring-red-500/30",
  },
];

export function ContactPanel({
  contact,
  conversationId,
  otherConversations,
}: {
  contact: Contact;
  conversationId: string;
  otherConversations: RelatedConversation[];
}) {
  const [open, setOpen] = useState(true);
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Persistência leve da preferência local
  useEffect(() => {
    const v = window.localStorage.getItem("contact_panel_open");
    if (v !== null) setOpen(v === "1");
  }, []);

  function toggle() {
    setOpen((v) => {
      window.localStorage.setItem("contact_panel_open", v ? "0" : "1");
      return !v;
    });
  }

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

  if (!open) {
    return (
      <button
        type="button"
        onClick={toggle}
        className="absolute right-4 top-4 z-10 p-2 rounded-lg glass-light text-stone-300 hover:text-brand-300 transition"
        title="Abrir painel do contato"
      >
        <PanelRightOpen className="h-4 w-4" />
      </button>
    );
  }

  return (
    <aside className="hidden lg:flex w-80 shrink-0 border-l border-white/5 bg-stone-950/40 backdrop-blur-xl flex-col animate-slide-in-right">
      <header className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
        <h3 className="text-[10px] uppercase tracking-[0.2em] font-semibold text-brand-300">
          Perfil do contato
        </h3>
        <button
          type="button"
          onClick={toggle}
          className="p-1 rounded text-stone-500 hover:text-stone-200 transition"
          title="Recolher painel"
        >
          <PanelRightClose className="h-4 w-4" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* Hero */}
        <div className="px-5 pt-6 pb-4 text-center border-b border-white/5">
          <div className="mx-auto h-20 w-20 rounded-full gradient-brand text-white text-2xl font-bold flex items-center justify-center shadow-brand-glow mb-3">
            {contact.name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <InlineText
            value={contact.name}
            contactId={contact.id}
            field="name"
            className="text-base font-semibold text-white"
            singleLine
            required
          />
          <p className="mt-1 text-xs text-stone-400 flex items-center justify-center gap-1.5">
            <Phone className="h-3 w-3" />
            {formatPhone(contact.phone)}
          </p>
        </div>

        {/* Status */}
        <section className="px-5 py-4 border-b border-white/5">
          <Label>Status</Label>
          <div className="mt-1.5 grid grid-cols-3 gap-1">
            {statusOptions.map((s) => {
              const active = contact.status === s.value;
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStatus(s.value)}
                  className={`px-2 py-1.5 rounded-lg text-[11px] font-medium ring-1 transition ${
                    active
                      ? s.cls
                      : "ring-white/10 text-stone-400 hover:bg-white/[0.04]"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Dados */}
        <section className="px-5 py-4 border-b border-white/5 space-y-4">
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
            <p className="text-xs text-stone-300">
              {contact.createdAt.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </Field>
        </section>

        {/* Notas */}
        <section className="px-5 py-4 border-b border-white/5">
          <div className="flex items-center justify-between mb-1.5">
            <Label>
              <span className="inline-flex items-center gap-1.5">
                <StickyNote className="h-3 w-3" /> Notas internas
              </span>
            </Label>
          </div>
          <InlineText
            value={contact.notes}
            contactId={contact.id}
            field="notes"
            placeholder="Visíveis só pra equipe..."
            multiline
          />
        </section>

        {/* Conversas relacionadas */}
        <section className="px-5 py-4">
          <Label>Outras conversas ({otherConversations.length})</Label>
          {otherConversations.length === 0 ? (
            <p className="mt-2 text-xs text-stone-500">Nenhuma outra conversa com este contato.</p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {otherConversations.slice(0, 5).map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/conversations/${c.id}`}
                    className="block px-2.5 py-2 rounded-lg hover:bg-white/[0.04] transition"
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <MessageSquare className="h-3 w-3 text-stone-500 shrink-0" />
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-stone-400">
                        {c.status}
                      </span>
                      <span className="text-[10px] text-stone-500 ml-auto">
                        {formatRelativeTime(c.lastMessageAt)}
                      </span>
                    </div>
                    <p className="text-xs text-stone-300 truncate">
                      {c.lastMessage ?? "—"}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <footer className="px-5 py-3 border-t border-white/5">
        <Link
          href={`/contatos/${contact.id}`}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-stone-300 hover:bg-white/[0.04] hover:text-white transition"
        >
          Ver perfil completo
          <ExternalLink className="h-3 w-3" />
        </Link>
      </footer>
    </aside>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">
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
      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400 flex items-center gap-1.5 mb-1">
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
  singleLine,
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
              className="flex-1 rounded-lg border border-white/10 bg-white/[0.03] text-stone-100 placeholder:text-stone-500 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/60 resize-none"
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
              className={`flex-1 rounded-lg border border-white/10 bg-white/[0.03] text-stone-100 placeholder:text-stone-500 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/60 ${className ?? ""}`}
              placeholder={placeholder}
            />
          )}
          <div className="flex flex-col gap-0.5 shrink-0">
            <button
              type="button"
              onClick={save}
              disabled={pending}
              className="p-1 rounded text-emerald-300 hover:bg-emerald-500/15 disabled:opacity-50"
              title="Salvar (Enter)"
            >
              <Check className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={cancel}
              className="p-1 rounded text-stone-500 hover:bg-white/[0.06]"
              title="Cancelar (Esc)"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
        {error && <p className="mt-1 text-[10px] text-red-400">{error}</p>}
      </div>
    );
  }

  const display = value && value.trim() ? value : null;

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={`mt-1 w-full text-left rounded-lg px-2 py-1.5 hover:bg-white/[0.04] transition ${
        singleLine ? "" : ""
      }`}
    >
      {display ? (
        <p
          className={`text-xs text-stone-200 ${multiline ? "whitespace-pre-wrap" : "truncate"} ${className ?? ""}`}
        >
          {display}
        </p>
      ) : (
        <p className="text-xs text-stone-500 italic">
          {placeholder ?? "—"}
        </p>
      )}
    </button>
  );
}
