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
    <div className="inline-flex gap-1 p-1 rounded-lg bg-zinc-100 dark:bg-zinc-800">
      {OPTIONS.map((opt) => (
        <Link
          key={opt.value}
          href={`/analytics?period=${opt.value}`}
          className={`px-3 py-1 rounded-md text-xs font-medium transition ${
            active === opt.value
              ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          }`}
        >
          {opt.label}
        </Link>
      ))}
    </div>
  );
}
