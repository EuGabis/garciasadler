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
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium ring-1 transition ${
        enabled
          ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30 hover:bg-emerald-500/25"
          : "bg-white/[0.04] text-stone-400 ring-white/10 hover:bg-white/[0.08]"
      }`}
      title={enabled ? "IA ativa nesta conversa — clique pra pausar" : "IA pausada — clique pra reativar"}
    >
      {enabled ? <Bot className="h-3 w-3" /> : <BotOff className="h-3 w-3" />}
      IA {enabled ? "on" : "off"}
    </button>
  );
}
