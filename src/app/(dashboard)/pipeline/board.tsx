"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, X, ArrowUpRight } from "lucide-react";
import type { KanbanColumnItem } from "@/lib/kanban";
import { moveCardAction, addCardAction, removeCardAction } from "./actions";
import { avatarColor, avatarInitial } from "@/lib/avatar-color";

type ConversationOption = {
  id: string;
  contact: { name: string; phone: string };
  lastMessage: string | null;
};

export function Board({
  columns,
  unassigned,
}: {
  columns: KanbanColumnItem[];
  unassigned: ConversationOption[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [dragCardId, setDragCardId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<string | null>(null);
  const [pickerOpenFor, setPickerOpenFor] = useState<string | null>(null);
  const dragImageRef = useRef<HTMLDivElement | null>(null);

  function onDragStart(e: React.DragEvent, cardId: string) {
    setDragCardId(cardId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", cardId);
  }

  function onDragOver(e: React.DragEvent, columnId: string) {
    if (!dragCardId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setOverColumn(columnId);
  }

  function onDragLeave(columnId: string) {
    setOverColumn((cur) => (cur === columnId ? null : cur));
  }

  function onDrop(e: React.DragEvent, columnId: string, indexHint = -1) {
    e.preventDefault();
    const cardId = dragCardId ?? e.dataTransfer.getData("text/plain");
    setDragCardId(null);
    setOverColumn(null);
    if (!cardId) return;

    const targetCol = columns.find((c) => c.id === columnId);
    const idx = indexHint >= 0 ? indexHint : targetCol?.cards.length ?? 0;

    startTransition(async () => {
      const r = await moveCardAction(cardId, columnId, idx);
      if (r.error) alert(r.error);
      router.refresh();
    });
  }

  function addCard(columnId: string, conversationId: string) {
    setPickerOpenFor(null);
    startTransition(async () => {
      const r = await addCardAction(columnId, conversationId);
      if (r.error) alert(r.error);
      router.refresh();
    });
  }

  function removeCard(cardId: string) {
    if (!confirm("Remover card do pipeline? A conversa permanece.")) return;
    startTransition(async () => {
      await removeCardAction(cardId);
      router.refresh();
    });
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 h-full">
      <div ref={dragImageRef} className="hidden" />

      {columns.map((col) => {
        const overLimit = col.wipLimit && col.cards.length >= col.wipLimit;
        const isOver = overColumn === col.id;
        return (
          <div
            key={col.id}
            className={`w-[300px] shrink-0 rounded-xl bg-stone-50 dark:bg-stone-900/60 flex flex-col transition-all border ${
              isOver
                ? "border-brand-500 ring-2 ring-brand-500/20 shadow-md"
                : "border-stone-200/80 dark:border-stone-800/80"
            }`}
            onDragOver={(e) => onDragOver(e, col.id)}
            onDragLeave={() => onDragLeave(col.id)}
            onDrop={(e) => onDrop(e, col.id)}
          >
            {/* Header */}
            <header className="px-3.5 py-3 flex items-center gap-2 border-b border-stone-200/60 dark:border-stone-800/60">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full shrink-0 ring-2 ring-white dark:ring-stone-900"
                style={{ backgroundColor: col.color }}
              />
              <h3 className="text-[13px] font-semibold tracking-tight truncate flex-1 text-stone-900 dark:text-stone-50">
                {col.name}
              </h3>
              <span
                className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-md text-[11px] font-medium tabular-nums ${
                  overLimit
                    ? "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400"
                    : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400"
                }`}
              >
                {col.cards.length}
                {col.wipLimit ? `/${col.wipLimit}` : ""}
              </span>
            </header>

            {/* Cards */}
            <ul className="flex-1 p-2 space-y-2 min-h-[80px] overflow-y-auto">
              {col.cards.length === 0 ? (
                <li className="text-center text-[11px] text-stone-400 dark:text-stone-600 py-6 px-3 rounded-md border border-dashed border-stone-200 dark:border-stone-800">
                  Arraste cards para cá
                </li>
              ) : (
                col.cards.map((card, idx) => {
                  const color = avatarColor(card.contactName);
                  return (
                    <li
                      key={card.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, card.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.stopPropagation();
                        onDrop(e, col.id, idx);
                      }}
                      className={`group rounded-lg border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-stone-900 p-3 hover:border-stone-300 dark:hover:border-stone-700 hover:shadow-sm transition cursor-grab active:cursor-grabbing ${
                        dragCardId === card.id ? "opacity-40" : ""
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`h-7 w-7 shrink-0 rounded-full ring-1 text-[11px] font-semibold flex items-center justify-center ${color.bg} ${color.text} ${color.ring}`}
                        >
                          {avatarInitial(card.contactName)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12.5px] font-semibold truncate tracking-tight text-stone-900 dark:text-stone-50">
                            {card.contactName}
                          </p>
                          <p className="text-[11px] text-stone-500 truncate mt-0.5">
                            {card.lastMessage ?? "—"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCard(card.id)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-stone-400 hover:text-red-500 transition"
                          title="Remover do pipeline"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {card.labels.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {card.labels.slice(0, 3).map((l) => (
                            <span
                              key={l.id}
                              className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium"
                              style={{
                                backgroundColor: `${l.color}1a`,
                                color: l.color,
                              }}
                            >
                              {l.name}
                            </span>
                          ))}
                        </div>
                      )}
                      <Link
                        href={`/conversations/${card.conversationId}`}
                        className="mt-2 inline-flex items-center gap-0.5 text-[10.5px] font-medium text-stone-500 hover:text-brand-600 transition-colors"
                      >
                        Abrir conversa
                        <ArrowUpRight className="h-2.5 w-2.5" />
                      </Link>
                    </li>
                  );
                })
              )}
            </ul>

            {/* Add card footer */}
            <footer className="p-2 border-t border-stone-200/60 dark:border-stone-800/60 relative">
              <button
                type="button"
                onClick={() =>
                  setPickerOpenFor((cur) => (cur === col.id ? null : col.id))
                }
                disabled={!!overLimit || unassigned.length === 0}
                className="w-full inline-flex items-center justify-center gap-1.5 h-8 rounded-md text-[12px] font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-100 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-stone-600 transition-colors"
                title={
                  overLimit
                    ? "Limite WIP atingido"
                    : unassigned.length === 0
                    ? "Nenhuma conversa disponível"
                    : "Adicionar card"
                }
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar card
              </button>

              {pickerOpenFor === col.id && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setPickerOpenFor(null)} />
                  <div className="absolute bottom-full left-2 right-2 mb-1 z-20 max-h-72 overflow-y-auto rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-lg shadow-stone-900/5 dark:shadow-black/40 py-1.5">
                    <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-stone-400 border-b border-stone-100 dark:border-stone-800 mb-1">
                      Sem card · {unassigned.length}
                    </div>
                    {unassigned.length === 0 ? (
                      <p className="px-3 py-3 text-[12px] text-stone-500">
                        Sem conversas disponíveis.
                      </p>
                    ) : (
                      unassigned.map((c) => {
                        const color = avatarColor(c.contact.name);
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => addCard(col.id, c.id)}
                            className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-stone-50 dark:hover:bg-stone-800/60 transition-colors text-left"
                          >
                            <div
                              className={`h-7 w-7 shrink-0 rounded-full ring-1 text-[10px] font-semibold flex items-center justify-center ${color.bg} ${color.text} ${color.ring}`}
                            >
                              {avatarInitial(c.contact.name)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[12.5px] font-medium truncate text-stone-900 dark:text-stone-100">
                                {c.contact.name}
                              </p>
                              <p className="text-[10.5px] text-stone-500 truncate">
                                {c.lastMessage ?? c.contact.phone}
                              </p>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </footer>
          </div>
        );
      })}
    </div>
  );
}

export function EmptyState() {
  return null;
}
