import Link from "next/link";
import {
  AlertTriangle,
  AlertOctagon,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/components/ui";
import type { ErrorLogRow, ErrorLevel } from "@/lib/error-logs";
import { LogRow } from "./logs-row";
import { LogActions } from "./logs-actions-buttons";
import { ScopeFilter } from "./scope-filter";
import { Section } from "./_ui";

type Props = {
  errors: ErrorLogRow[];
  scopes: string[];
  filters: { level?: ErrorLevel; scope?: string; onlyUnack: boolean };
  unackCount: number;
  canManage: boolean;
};

export function LogsTab({ errors, scopes, filters, unackCount, canManage }: Props) {
  const counts = {
    fatal: errors.filter((e) => e.level === "fatal").length,
    error: errors.filter((e) => e.level === "error").length,
    warn: errors.filter((e) => e.level === "warn").length,
  };

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          icon={AlertOctagon}
          label="Fatal"
          value={counts.fatal}
          color="bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
        />
        <KpiCard
          icon={AlertTriangle}
          label="Erros"
          value={counts.error}
          color="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
        />
        <KpiCard
          icon={AlertCircle}
          label="Warnings"
          value={counts.warn}
          color="bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400"
        />
        <KpiCard
          icon={CheckCircle2}
          label="Pendentes"
          value={unackCount}
          color="bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
          hint="não revisados"
        />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-1.5">
        <FilterPill active={!filters.level} href="/configuracoes?tab=logs">
          Todos níveis
        </FilterPill>
        <FilterPill active={filters.level === "fatal"} href="/configuracoes?tab=logs&level=fatal">
          Fatal
        </FilterPill>
        <FilterPill active={filters.level === "error"} href="/configuracoes?tab=logs&level=error">
          Error
        </FilterPill>
        <FilterPill active={filters.level === "warn"} href="/configuracoes?tab=logs&level=warn">
          Warn
        </FilterPill>

        <span className="mx-1 h-5 w-px bg-stone-200 dark:bg-stone-700" />

        <FilterPill
          active={filters.onlyUnack}
          href={
            filters.onlyUnack
              ? "/configuracoes?tab=logs"
              : "/configuracoes?tab=logs&unack=1"
          }
        >
          {filters.onlyUnack ? "✓ Só pendentes" : "Só pendentes"}
        </FilterPill>

        {scopes.length > 0 && <ScopeFilter scopes={scopes} active={filters.scope} />}

        <div className="ml-auto">
          {canManage && <LogActions hasErrors={errors.length > 0} unackCount={unackCount} />}
        </div>
      </div>

      {/* Lista */}
      <Section
        title={`Últimos ${errors.length} eventos`}
        description="Erros e warnings registrados nesta workspace."
        noPadding
      >
        {errors.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto h-10 w-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-[13px] font-medium text-stone-700 dark:text-stone-300">
              Nenhum erro registrado
            </p>
            <p className="text-[12px] text-stone-500 mt-1">
              {filters.level || filters.scope || filters.onlyUnack
                ? "Sem resultados para os filtros atuais."
                : "Sistema rodando sem erros."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-stone-100 dark:divide-stone-800/60">
            {errors.map((err) => (
              <li key={err.id}>
                <LogRow err={err} canManage={canManage} />
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  color,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-stone-900 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-stone-500">
          {label}
        </span>
        <span className={cn("h-7 w-7 rounded-md flex items-center justify-center", color)}>
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
      <p className="text-2xl font-semibold tracking-tight tabular-nums text-stone-900 dark:text-stone-50">
        {value}
      </p>
      {hint && <p className="text-[11.5px] text-stone-500 mt-1">{hint}</p>}
    </div>
  );
}

function FilterPill({
  active,
  href,
  children,
}: {
  active: boolean;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "h-7 px-3 inline-flex items-center rounded-md text-[11.5px] font-medium transition-colors",
        active
          ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900"
          : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700"
      )}
    >
      {children}
    </Link>
  );
}
