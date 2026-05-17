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
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition ${
        enabled
          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20"
          : "bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-300 dark:hover:bg-stone-700"
      }`}
      title={enabled ? "IA ativa nesta conversa — clique pra pausar" : "IA pausada — clique pra reativar"}
    >
      {enabled ? <Bot className="h-3 w-3" /> : <BotOff className="h-3 w-3" />}
      IA {enabled ? "on" : "off"}
    </button>
  );
}
