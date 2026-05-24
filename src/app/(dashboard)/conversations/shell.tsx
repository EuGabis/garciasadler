"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type Props = {
  inbox: ReactNode;
  chat: ReactNode;
};

/**
 * Em desktop (md+): mostra inbox + chat lado-a-lado.
 * Em mobile: mostra inbox QUANDO estiver em /conversations, ou chat QUANDO estiver em /conversations/[id].
 */
export function ConversationsShell({ inbox, chat }: Props) {
  const pathname = usePathname() ?? "/conversations";
  const isDetail =
    pathname.startsWith("/conversations/") && pathname !== "/conversations";

  return (
    <div className="flex h-full md:h-screen bg-stone-50 dark:bg-stone-950">
      <aside
        className={`${
          isDetail ? "hidden" : "flex"
        } md:flex w-full md:w-[340px] shrink-0 border-r border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-stone-900 flex-col`}
      >
        {inbox}
      </aside>

      <section
        className={`${
          isDetail ? "flex" : "hidden"
        } md:flex flex-1 min-w-0 bg-stone-50 dark:bg-stone-950`}
      >
        {chat}
      </section>
    </div>
  );
}
