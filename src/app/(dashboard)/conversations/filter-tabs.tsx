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
        className={`flex-1 px-2 py-1.5 rounded-md text-[10px] font-semibold uppercase tracking-wider transition ${
          !mineOnly
            ? "bg-brand-500 text-white shadow-brand-glow"
            : "bg-white/[0.04] text-stone-400 hover:bg-white/[0.08] hover:text-stone-200"
        }`}
      >
        Todas
      </button>
      <button
        type="button"
        onClick={() => toggle(true)}
        disabled={pending}
        className={`flex-1 px-2 py-1.5 rounded-md text-[10px] font-semibold uppercase tracking-wider transition ${
          mineOnly
            ? "bg-brand-500 text-white shadow-brand-glow"
            : "bg-white/[0.04] text-stone-400 hover:bg-white/[0.08] hover:text-stone-200"
        }`}
      >
        Minhas
      </button>
    </div>
  );
}
