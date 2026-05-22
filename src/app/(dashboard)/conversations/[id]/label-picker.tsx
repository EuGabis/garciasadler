"use client";

import { useState, useTransition } from "react";
import { Tag, X, Check } from "lucide-react";
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
        className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-[12px] font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-50 transition-colors"
        title="Etiquetas"
      >
        <Tag className="h-3.5 w-3.5" />
        {attached.length > 0 ? attached.length : <span>Etiquetar</span>}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 z-20 w-64 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-lg shadow-stone-900/5 dark:shadow-black/40 py-1.5 max-h-72 overflow-y-auto">
            <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-stone-400 border-b border-stone-100 dark:border-stone-800 mb-1">
              Etiquetas
            </div>
            {available.length === 0 ? (
              <p className="px-3 py-3 text-[12px] text-stone-500">
                Sem etiquetas. Crie em{" "}
                <span className="font-medium text-stone-700 dark:text-stone-300">/etiquetas</span>.
              </p>
            ) : (
              available.map((l) => {
                const isAttached = attachedIds.has(l.id);
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => toggle(l.id)}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[13px] hover:bg-stone-50 dark:hover:bg-stone-800/60 transition-colors"
                  >
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: l.color }}
                    />
                    <span className="flex-1 text-left truncate text-stone-700 dark:text-stone-300">
                      {l.name}
                    </span>
                    {isAttached && <Check className="h-3.5 w-3.5 text-brand-600" />}
                  </button>
                );
              })
            )}
          </div>
        </>
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
          className="group inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium hover:opacity-70 transition"
          style={{ backgroundColor: `${l.color}1a`, color: l.color }}
          title="Clique para remover"
        >
          {l.name}
          <X className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100" />
        </button>
      ))}
    </div>
  );
}
