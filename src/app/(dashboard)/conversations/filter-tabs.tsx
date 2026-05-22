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
    <div className="px-5 pb-3 flex gap-1 border-b border-stone-200/80 dark:border-stone-800/80">
      <button
        type="button"
        onClick={() => toggle(false)}
        disabled={pending}
        className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
          !mineOnly
            ? "bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-50"
            : "text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
        }`}
      >
        Todas
      </button>
      <button
        type="button"
        onClick={() => toggle(true)}
        disabled={pending}
        className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
          mineOnly
            ? "bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-50"
            : "text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
        }`}
      >
        Minhas
      </button>
    </div>
  );
}
