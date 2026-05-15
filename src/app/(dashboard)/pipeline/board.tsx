"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, X, Trash2 } from "lucide-react";
import type { KanbanColumnItem } from "@/lib/kanban";
import { moveCardAction, addCardAction, removeCardAction } from "./actions";

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

    // Se soltou em cima de card específico, usa o índice; senão joga no fim
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
    if (!confirm("Remover card do pipeline? (a conversa permanece)")) return;
    startTransition(async () => {
      await removeCardAction(cardId);
      router.refresh();
    });
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      <div ref={dragImageRef} className="hidden" />

      {columns.map((col) => {
        const overLimit = col.wipLimit && col.cards.length >= col.wipLimit;
        return (
          <div
            key={col.id}
            className={`w-72 shrink-0 rounded-xl border bg-white dark:bg-slate-900 flex flex-col ${
              overColumn === col.id
                ? "border-brand-orange-400 dark:border-brand-orange-500 ring-2 ring-brand-orange-100 dark:ring-brand-orange-900"
                : "border-slate-200 dark:border-slate-800"
            }`}
            onDragOver={(e) => onDragOver(e, col.id)}
            onDragLeave={() => onDragLeave(col.id)}
            onDrop={(e) => onDrop(e, col.id)}
          >
            <header className="px-3 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: col.color }}
              />
              <h3 className="text-sm font-semibold truncate flex-1">{col.name}</h3>
              <span className="text-xs text-slate-500">
                {col.cards.length}
                {col.wipLimit ? `/${col.wipLimit}` : ""}
              </span>
            </header>

            <ul className="flex-1 p-2 space-y-2 min-h-[60px]">
              {col.cards.length === 0 ? (
                <li className="text-center text-[11px] text-slate-400 py-4 italic">
                  arraste cards pra cá
                </li>
              ) : (
                col.cards.map((card, idx) => (
                  <li
                    key={card.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, card.id)}
                    onDragOver={(e) => {
                      e.preventDefault();
                    }}
                    onDrop={(e) => {
                      e.stopPropagation();
                      onDrop(e, col.id, idx);
                    }}
                    className={`group rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 hover:border-brand-orange-300 dark:hover:border-brand-orange-700 transition cursor-grab active:cursor-grabbing ${
                      dragCardId === card.id ? "opacity-40" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="h-7 w-7 shrink-0 rounded-full bg-brand-orange-500/10 dark:bg-brand-orange-500/20 text-brand-orange-700 dark:text-brand-orange-300 text-[11px] font-semibold flex items-center justify-center">
                        {card.contactName[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{card.contactName}</p>
                        <p className="text-[11px] text-slate-500 truncate">{card.lastMessage ?? "—"}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCard(card.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition"
                        title="Remover do pipeline"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {card.labels.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {card.labels.slice(0, 3).map((l) => (
                          <span
                            key={l.id}
                            className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium"
                            style={{ backgroundColor: `${l.color}22`, color: l.color }}
                          >
                            {l.name}
                          </span>
                        ))}
                      </div>
                    )}
                    <Link
                      href={`/conversations/${card.conversationId}`}
                      className="block mt-1.5 text-[10px] text-brand-orange-600 hover:underline"
                    >
                      abrir conversa →
                    </Link>
                  </li>
                ))
              )}
            </ul>

            <footer className="p-2 border-t border-slate-200 dark:border-slate-800 relative">
              <button
                type="button"
                onClick={() =>
                  setPickerOpenFor((cur) => (cur === col.id ? null : col.id))
                }
                disabled={!!overLimit || unassigned.length === 0}
                className="w-full inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent transition"
                title={
                  overLimit
                    ? "Limite WIP atingido"
                    : unassigned.length === 0
                    ? "Nenhuma conversa disponível"
                    : "Adicionar card"
                }
              >
                <Plus className="h-3 w-3" />
                Adicionar
              </button>

              {pickerOpenFor === col.id && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setPickerOpenFor(null)} />
                  <div className="absolute bottom-full left-2 right-2 mb-1 z-20 max-h-60 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg py-1">
                    {unassigned.length === 0 ? (
                      <p className="px-3 py-3 text-xs text-slate-500">
                        Sem conversas disponíveis.
                      </p>
                    ) : (
                      unassigned.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => addCard(col.id, c.id)}
                          className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                        >
                          <p className="text-xs font-medium truncate">{c.contact.name}</p>
                          <p className="text-[10px] text-slate-500 truncate">
                            {c.lastMessage ?? c.contact.phone}
                          </p>
                        </button>
                      ))
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
