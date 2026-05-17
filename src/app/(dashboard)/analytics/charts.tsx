import { ArrowDown, ArrowUp } from "lucide-react";

export function KpiCard({
  label,
  value,
  hint,
  trend,
}: {
  label: string;
  value: string | number;
  hint?: string;
  trend?: { direction: "up" | "down"; label: string } | null;
}) {
  return (
    <div className="rounded-2xl glass p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">{label}</p>
      <p className="mt-2 font-display text-3xl text-white leading-none">{value}</p>
      {(hint || trend) && (
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-stone-400">
          {trend && (
            <span
              className={`inline-flex items-center gap-0.5 font-medium ${
                trend.direction === "up" ? "text-emerald-300" : "text-red-400"
              }`}
            >
              {trend.direction === "up" ? (
                <ArrowUp className="h-3 w-3" />
              ) : (
                <ArrowDown className="h-3 w-3" />
              )}
              {trend.label}
            </span>
          )}
          {hint && <span>{hint}</span>}
        </div>
      )}
    </div>
  );
}

export function BarList({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: Array<{ label: string; value: number; color?: string }>;
  emptyText: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="rounded-2xl glass p-5">
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-300 mb-4">
        {title}
      </h2>
      {items.length === 0 ? (
        <p className="text-xs text-stone-400 py-2">{emptyText}</p>
      ) : (
        <ul className="space-y-2.5">
          {items.map((item, i) => {
            const pct = Math.max(2, (item.value / max) * 100);
            return (
              <li key={i}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="truncate text-stone-200">{item.label}</span>
                  <span className="text-stone-400 font-medium tabular-nums">{item.value}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: item.color ?? "#b5491a",
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function MessagesChart({
  data,
}: {
  data: Array<{ date: string; inbound: number; outbound: number }>;
}) {
  const width = 800;
  const height = 200;
  const padding = { top: 10, right: 10, bottom: 24, left: 30 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const max = Math.max(1, ...data.flatMap((d) => [d.inbound, d.outbound]));
  const step = data.length > 1 ? chartW / (data.length - 1) : 0;

  function px(i: number): number {
    return padding.left + i * step;
  }
  function py(v: number): number {
    return padding.top + chartH - (v / max) * chartH;
  }

  const inboundPath = data
    .map((d, i) => `${i === 0 ? "M" : "L"}${px(i)},${py(d.inbound)}`)
    .join(" ");
  const outboundPath = data
    .map((d, i) => `${i === 0 ? "M" : "L"}${px(i)},${py(d.outbound)}`)
    .join(" ");

  const tickIdxs =
    data.length <= 2
      ? data.map((_, i) => i)
      : [0, Math.floor((data.length - 1) / 2), data.length - 1];

  return (
    <div className="rounded-2xl glass p-5 text-stone-100">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-300">
          Mensagens por dia
        </h2>
        <div className="flex items-center gap-3 text-[11px] text-stone-400">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-3 rounded-sm bg-brand-500" /> Recebidas
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-3 rounded-sm bg-emerald-400" /> Enviadas
          </span>
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="none">
        {[0, 0.5, 1].map((p, i) => {
          const y = padding.top + chartH * (1 - p);
          return (
            <line
              key={i}
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke="currentColor"
              strokeOpacity={0.1}
              strokeWidth={1}
            />
          );
        })}
        <path d={inboundPath} fill="none" stroke="#d26443" strokeWidth={2} />
        <path d={outboundPath} fill="none" stroke="#34d399" strokeWidth={2} />

        {data.map((d, i) => (
          <g key={i}>
            <circle cx={px(i)} cy={py(d.inbound)} r={2.5} fill="#d26443" />
            <circle cx={px(i)} cy={py(d.outbound)} r={2.5} fill="#34d399" />
          </g>
        ))}

        {tickIdxs.map((i) => {
          const d = data[i];
          if (!d) return null;
          const label = d.date.slice(5);
          return (
            <text
              key={`x-${i}`}
              x={px(i)}
              y={height - 6}
              fontSize={10}
              textAnchor="middle"
              fill="currentColor"
              opacity={0.5}
            >
              {label}
            </text>
          );
        })}

        <text x={4} y={padding.top + 4} fontSize={9} fill="currentColor" opacity={0.5}>
          {max}
        </text>
        <text x={4} y={height - padding.bottom + 2} fontSize={9} fill="currentColor" opacity={0.5}>
          0
        </text>
      </svg>
    </div>
  );
}

export function HourHeatmap({ data }: { data: Array<{ hour: number; count: number }> }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="rounded-2xl glass p-5">
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-300 mb-3">
        Distribuição por hora do dia
      </h2>
      <div
        className="grid grid-cols-24 gap-0.5"
        style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}
      >
        {data.map((d) => {
          const intensity = d.count / max;
          return (
            <div
              key={d.hour}
              title={`${String(d.hour).padStart(2, "0")}:00 — ${d.count} msgs`}
              className="aspect-square rounded-sm ring-1 ring-white/5"
              style={{
                backgroundColor: `rgba(210, 100, 67, ${0.06 + intensity * 0.85})`,
              }}
            />
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-stone-500">
        <span>0h</span>
        <span>6h</span>
        <span>12h</span>
        <span>18h</span>
        <span>23h</span>
      </div>
    </div>
  );
}
