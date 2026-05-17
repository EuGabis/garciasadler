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
    <div className="inline-flex gap-1 p-1 rounded-lg bg-white/[0.04] border border-white/10">
      {OPTIONS.map((opt) => (
        <Link
          key={opt.value}
          href={`/analytics?period=${opt.value}`}
          className={`px-3 py-1.5 rounded-md text-[10px] font-semibold uppercase tracking-wider transition ${
            active === opt.value
              ? "bg-brand-500 text-white shadow-brand-glow"
              : "text-stone-400 hover:text-white hover:bg-white/[0.04]"
          }`}
        >
          {opt.label}
        </Link>
      ))}
    </div>
  );
}
