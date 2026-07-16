"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bot, BotOff } from "lucide-react";
import { toggleAiAction } from "./ai-toggle-action";

export function AiBadge({ conversationId, enabled }: { conversationId: string; enabled: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function toggle() {
    start(async () => {
      await toggleAiAction(conversationId);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-[11px] font-semibold uppercase tracking-wider ring-1 transition-colors disabled:opacity-60 ${
        enabled
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 ring-emerald-200/60 dark:ring-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/15"
          : "bg-stone-50 text-stone-500 dark:bg-stone-800 dark:text-stone-400 ring-stone-200 dark:ring-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700"
      }`}
      title={enabled ? "IA ativa nesta conversa - clique para pausar" : "IA pausada - clique para reativar"}
    >
      {enabled ? <Bot className="h-3.5 w-3.5" /> : <BotOff className="h-3.5 w-3.5" />}
      IA {enabled ? "on" : "off"}
    </button>
  );
}
