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
    <div className="inline-flex gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
      {OPTIONS.map((opt) => (
        <Link
          key={opt.value}
          href={`/analytics?period=${opt.value}`}
          className={`px-3 py-1 rounded-md text-xs font-medium transition ${
            active === opt.value
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          }`}
        >
          {opt.label}
        </Link>
      ))}
    </div>
  );
}
