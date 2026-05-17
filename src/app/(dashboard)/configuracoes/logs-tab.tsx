import Link from "next/link";
import { AlertTriangle, AlertOctagon, AlertCircle, CheckCircle2, Trash2 } from "lucide-react";
import { Button, SectionCard, cn } from "@/components/ui";
import type { ErrorLogRow, ErrorLevel } from "@/lib/error-logs";
import { LogRow } from "./logs-row";
import { LogActions } from "./logs-actions-buttons";

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
          color="bg-red-500/15 text-red-300 ring-1 ring-red-500/30"
        />
        <KpiCard
          icon={AlertTriangle}
          label="Erros"
          value={counts.error}
          color="bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30"
        />
        <KpiCard
          icon={AlertCircle}
          label="Warnings"
          value={counts.warn}
          color="bg-white/[0.06] text-stone-300 ring-1 ring-white/10"
        />
        <KpiCard
          icon={CheckCircle2}
          label="Pendentes"
          value={unackCount}
          color="bg-brand-500/15 text-brand-300 ring-1 ring-brand-500/30"
          hint="não revisados"
        />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
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

        <span className="mx-1 h-5 w-px bg-white/10" />

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

        {scopes.length > 0 && (
          <select
            defaultValue={filters.scope ?? ""}
            onChange={(e) => {
              const url = new URL(window.location.href);
              if (e.target.value) url.searchParams.set("scope", e.target.value);
              else url.searchParams.delete("scope");
              window.location.href = url.toString();
            }}
            className="ml-auto px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] text-stone-100 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/60"
          >
            <option value="" className="bg-stone-900">
              Todos os escopos
            </option>
            {scopes.map((s) => (
              <option key={s} value={s} className="bg-stone-900">
                {s}
              </option>
            ))}
          </select>
        )}

        {canManage && <LogActions hasErrors={errors.length > 0} unackCount={unackCount} />}
      </div>

      {/* Lista */}
      <SectionCard
        title={`Últimos ${errors.length} eventos`}
        description="Erros e warnings registrados nesta workspace."
        noPadding
      >
        {errors.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-400 mb-2" />
            <p className="text-sm font-medium text-white">Nenhum erro registrado</p>
            <p className="text-xs text-stone-400 mt-1">
              {filters.level || filters.scope || filters.onlyUnack
                ? "Sem resultados pros filtros atuais."
                : "Sistema rodando sem erros."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            {errors.map((err) => (
              <li key={err.id}>
                <LogRow err={err} canManage={canManage} />
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
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
    <div className="rounded-2xl glass p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">
          {label}
        </span>
        <span className={cn("h-7 w-7 rounded-lg flex items-center justify-center", color)}>
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
      <p className="font-display text-3xl text-white tabular-nums leading-none">{value}</p>
      {hint && <p className="text-[10px] text-stone-400 mt-1">{hint}</p>}
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
        "px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition",
        active
          ? "bg-brand-500 text-white shadow-brand-glow"
          : "bg-white/[0.04] text-stone-300 hover:bg-white/[0.08] hover:text-white"
      )}
    >
      {children}
    </Link>
  );
}

// Re-export pra deixar Button/Trash2 detectáveis se usarmos depois
export { Button, Trash2 };
