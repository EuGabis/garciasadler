"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setMineOnly } from "./filter-actions";

export function FilterTabs({ mineOnly }: { mineOnly: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function toggle(v: boolean) {
    start(async () => {
      await setMineOnly(v);
      router.refresh();
    });
  }

  return (
    <div className="px-3 pt-3 pb-2 flex gap-1">
      <button
        type="button"
        onClick={() => toggle(false)}
        disabled={pending}
        className={`flex-1 px-2 py-1 rounded-md text-xs font-medium transition ${
          !mineOnly
            ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
        }`}
      >
        Todas
      </button>
      <button
        type="button"
        onClick={() => toggle(true)}
        disabled={pending}
        className={`flex-1 px-2 py-1 rounded-md text-xs font-medium transition ${
          mineOnly
            ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
        }`}
      >
        Minhas
      </button>
    </div>
  );
}
