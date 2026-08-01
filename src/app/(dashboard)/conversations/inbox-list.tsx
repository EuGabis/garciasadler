"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mic, Image as ImageIcon, Video, FileText, MapPin, Sticker, Inbox, Loader2 } from "lucide-react";
import { formatRelativeTime } from "@/lib/format";
import { avatarColor, avatarInitial } from "@/lib/avatar-color";
import { loadMoreConversationsAction } from "./load-more-action";
import type { ConversationListItem } from "@/lib/conversations";

const MEDIA_PATTERNS: Array<{
  match: RegExp;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { match: /^\[áudio\]/i, label: "Áudio", icon: Mic },
  { match: /^\[imagem\]/i, label: "Imagem", icon: ImageIcon },
  { match: /^\[vídeo\]/i, label: "Vídeo", icon: Video },
  { match: /^\[documento\]/i, label: "Documento", icon: FileText },
  { match: /^\[figurinha\]/i, label: "Figurinha", icon: Sticker },
  { match: /^\[localização\]/i, label: "Localização", icon: MapPin },
];

function MessagePreview({ text }: { text: string | null }) {
  if (!text) return <span className="text-stone-400 italic">-</span>;
  for (const p of MEDIA_PATTERNS) {
    if (p.match.test(text)) {
      const rest = text.replace(p.match, "").trim();
      const Icon = p.icon;
      return (
        <span className="inline-flex items-center gap-1.5">
          <Icon className="h-3 w-3 shrink-0 text-stone-400" />
          <span className="truncate">
            {p.label}
            {rest ? <span className="text-stone-400"> · {rest}</span> : null}
          </span>
        </span>
      );
    }
  }
  return <span className="truncate">{text}</span>;
}

type Props = {
  initialItems: ConversationListItem[];
  initialHasMore: boolean;
  pageSize: number;
  mineOnly: boolean;
};

export function InboxList({ initialItems, initialHasMore, pageSize, mineOnly }: Props) {
  const pathname = usePathname();
  const activeId = pathname?.startsWith("/conversations/")
    ? pathname.split("/")[2]
    : null;

  const [items, setItems] = useState<ConversationListItem[]>(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Reset quando o SSR trocar (mineOnly muda ou refresh de rota)
  useEffect(() => {
    setItems(initialItems);
    setHasMore(initialHasMore);
    setLoadError(null);
  }, [initialItems, initialHasMore]);

  const sentinelRef = useRef<HTMLLIElement | null>(null);
  const loadingRef = useRef(false);

  const loadMore = useCallback(() => {
    // Guard: pending in-flight ou nao tem mais nada
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    setLoadError(null);
    startTransition(async () => {
      try {
        const r = await loadMoreConversationsAction({
          offset: items.length,
          limit: pageSize,
          mineOnly,
        });
        if (!r.ok) {
          setLoadError(r.error);
          return;
        }
        setItems((prev) => [...prev, ...r.items]);
        setHasMore(r.hasMore);
      } catch (e) {
        setLoadError((e as Error).message);
      } finally {
        loadingRef.current = false;
      }
    });
  }, [items.length, hasMore, pageSize, mineOnly]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "200px 0px" } // dispara 200px antes do sentinel entrar
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore]);

  if (items.length === 0) {
    return (
      <div className="px-6 py-16 text-center">
        <div className="mx-auto h-10 w-10 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-3">
          <Inbox className="h-4 w-4 text-stone-400" />
        </div>
        <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
          Nenhuma conversa
        </p>
        <p className="text-xs text-stone-500 mt-1">Aguardando primeira mensagem</p>
      </div>
    );
  }

  return (
    <ul>
      {items.map((c) => {
        const isActive = activeId === c.id;
        const color = avatarColor(c.contactName);
        return (
          <li key={c.id} className="relative">
            {isActive && (
              <span className="absolute left-0 top-3 bottom-3 w-[2px] rounded-r-full bg-brand-500" />
            )}
            <Link
              href={`/conversations/${c.id}`}
              className={`block pl-5 pr-4 py-3 transition-colors border-b border-stone-100/60 dark:border-stone-800/40 last:border-b-0 ${
                isActive
                  ? "bg-stone-50/70 dark:bg-stone-800/40"
                  : "hover:bg-stone-50/50 dark:hover:bg-stone-800/30"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="relative shrink-0">
                  <div
                    className={`h-9 w-9 rounded-full ring-1 text-[13px] font-semibold flex items-center justify-center ${color.bg} ${color.text} ${color.ring}`}
                  >
                    {avatarInitial(c.contactName)}
                  </div>
                  {c.unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-brand-500 ring-2 ring-white dark:ring-stone-900" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p
                      className={`text-[13px] truncate tracking-tight ${
                        c.unreadCount > 0
                          ? "font-semibold text-stone-900 dark:text-stone-50"
                          : "font-medium text-stone-700 dark:text-stone-200"
                      }`}
                    >
                      {c.contactName}
                    </p>
                    <span className="text-[10.5px] tabular-nums text-stone-400 dark:text-stone-500 shrink-0">
                      {formatRelativeTime(c.lastMessageAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`text-[12px] truncate ${
                        c.unreadCount > 0
                          ? "text-stone-700 dark:text-stone-300"
                          : "text-stone-500 dark:text-stone-400"
                      }`}
                    >
                      <MessagePreview text={c.lastMessage} />
                    </p>
                    {c.unreadCount > 1 && (
                      <span className="shrink-0 inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full bg-brand-500/10 text-brand-700 dark:text-brand-400 text-[10px] font-semibold tabular-nums">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                  {(c.labels.length > 0 || c.assignedTo.length > 0) && (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {c.assignedTo.slice(0, 3).map((u) => {
                        const ac = avatarColor(u.name);
                        return (
                          <span
                            key={u.id}
                            title={u.name}
                            className={`inline-flex items-center justify-center h-[18px] w-[18px] rounded-full text-[9px] font-bold ring-2 ring-white dark:ring-stone-900 ${ac.bg} ${ac.text}`}
                          >
                            {avatarInitial(u.name)}
                          </span>
                        );
                      })}
                      {c.labels.slice(0, 2).map((l) => (
                        <span
                          key={l.id}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium"
                          style={{
                            backgroundColor: `${l.color}1a`,
                            color: l.color,
                          }}
                        >
                          {l.name}
                        </span>
                      ))}
                      {c.labels.length > 2 && (
                        <span className="text-[10px] text-stone-400">
                          +{c.labels.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          </li>
        );
      })}

      {/* Sentinel + estado de load more */}
      {hasMore && (
        <li ref={sentinelRef} className="px-5 py-4 flex items-center justify-center">
          {isPending ? (
            <span className="inline-flex items-center gap-2 text-[11.5px] text-stone-500">
              <Loader2 className="h-3 w-3 animate-spin" /> Carregando…
            </span>
          ) : loadError ? (
            <button
              type="button"
              onClick={loadMore}
              className="text-[11.5px] text-red-600 hover:underline"
            >
              Erro ao carregar. Tentar de novo
            </button>
          ) : (
            <span className="text-[11.5px] text-stone-400">Role pra ver mais</span>
          )}
        </li>
      )}

      {!hasMore && items.length > pageSize && (
        <li className="px-5 py-4 text-center text-[11px] text-stone-400">
          Fim da lista
        </li>
      )}
    </ul>
  );
}
