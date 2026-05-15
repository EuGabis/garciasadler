"use client";

import { useState, useTransition } from "react";
import { Tag, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toggleLabelOnConversationAction } from "@/app/(dashboard)/etiquetas/actions";

type Label = { id: string; name: string; color: string };

export function LabelPicker({
  conversationId,
  attached,
  available,
}: {
  conversationId: string;
  attached: Label[];
  available: Label[];
}) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const attachedIds = new Set(attached.map((l) => l.id));

  function toggle(labelId: string) {
    startTransition(async () => {
      await toggleLabelOnConversationAction(conversationId, labelId);
      router.refresh();
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
        title="Etiquetas"
      >
        <Tag className="h-3.5 w-3.5" />
        {attached.length > 0 ? `${attached.length}` : "Etiquetar"}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 w-60 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg py-1 max-h-72 overflow-y-auto">
            {available.length === 0 ? (
              <p className="px-3 py-3 text-xs text-zinc-500">
                Sem etiquetas. Crie em <span className="font-medium">/etiquetas</span>.
              </p>
            ) : (
              available.map((l) => {
                const isAttached = attachedIds.has(l.id);
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => toggle(l.id)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
                  >
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: l.color }}
                    />
                    <span className="flex-1 text-left truncate">{l.name}</span>
                    {isAttached && (
                      <span className="text-[10px] text-indigo-600 font-medium">✓</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </>
      )}

      {attached.length > 0 && (
        <div className="absolute right-0 top-full mt-1 hidden" />
      )}
    </div>
  );
}

export function AttachedLabels({
  conversationId,
  labels,
}: {
  conversationId: string;
  labels: Label[];
}) {
  const [, startTransition] = useTransition();
  const router = useRouter();

  function detach(labelId: string) {
    startTransition(async () => {
      await toggleLabelOnConversationAction(conversationId, labelId);
      router.refresh();
    });
  }

  if (labels.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {labels.map((l) => (
        <button
          key={l.id}
          type="button"
          onClick={() => detach(l.id)}
          className="group inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium hover:opacity-70 transition"
          style={{ backgroundColor: `${l.color}22`, color: l.color }}
          title="Clique pra remover"
        >
          {l.name}
          <X className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100" />
        </button>
      ))}
    </div>
  );
}
