import Link from "next/link";
import type { AnalyticsPeriod } from "@/lib/analytics";

const OPTIONS: Array<{ value: AnalyticsPeriod; label: string }> = [
  { value: "today", label: "Hoje" },
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "90 dias" },
];

export function PeriodTabs({ active }: { active: AnalyticsPeriod }) {
  return (
    <div className="inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-stone-100 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-800/80">
      {OPTIONS.map((opt) => {
        const isActive = active === opt.value;
        return (
          <Link
            key={opt.value}
            href={`/analytics?period=${opt.value}`}
            className={`px-3 h-8 inline-flex items-center rounded-md text-[12px] font-medium transition-colors ${
              isActive
                ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-50 shadow-sm ring-1 ring-stone-200/60 dark:ring-stone-700/60"
                : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
            }`}
          >
            {opt.label}
          </Link>
        );
      })}
    </div>
  );
}
