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
    <div className="rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-stone-900 p-5">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-stone-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums text-stone-900 dark:text-stone-50">
        {value}
      </p>
      {(hint || trend) && (
        <div className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-stone-500">
          {trend && (
            <span
              className={`inline-flex items-center gap-0.5 font-medium ${
                trend.direction === "up"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
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
    <div className="rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-stone-900 p-5">
      <h2 className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-stone-500 mb-4">
        {title}
      </h2>
      {items.length === 0 ? (
        <p className="text-[12.5px] text-stone-400 py-2">{emptyText}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item, i) => {
            const pct = Math.max(2, (item.value / max) * 100);
            const barColor = item.color ?? "#b5491a";
            return (
              <li key={i}>
                <div className="flex items-center justify-between text-[12px] mb-1.5">
                  <span className="truncate font-medium text-stone-700 dark:text-stone-300">
                    {item.label}
                  </span>
                  <span className="text-stone-500 font-medium tabular-nums shrink-0 ml-3">
                    {item.value}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: barColor,
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
  const padding = { top: 12, right: 12, bottom: 28, left: 32 };
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

  // Stripe-ish blue & green palette
  const COLOR_IN = "#b5491a"; // brand terracota
  const COLOR_OUT = "#10b981"; // emerald

  return (
    <div className="rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-stone-900 p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-stone-500">
          Mensagens por dia
        </h2>
        <div className="flex items-center gap-4 text-[11.5px] text-stone-500">
          <span className="inline-flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: COLOR_IN }}
            />
            Recebidas
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: COLOR_OUT }}
            />
            Enviadas
          </span>
        </div>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        preserveAspectRatio="none"
      >
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
          const y = padding.top + chartH * (1 - p);
          return (
            <line
              key={i}
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke="currentColor"
              strokeOpacity={0.06}
              strokeWidth={1}
            />
          );
        })}
        <path d={inboundPath} fill="none" stroke={COLOR_IN} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <path d={outboundPath} fill="none" stroke={COLOR_OUT} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {data.map((d, i) => (
          <g key={i}>
            <circle cx={px(i)} cy={py(d.inbound)} r={3} fill="white" stroke={COLOR_IN} strokeWidth={1.5} />
            <circle cx={px(i)} cy={py(d.outbound)} r={3} fill="white" stroke={COLOR_OUT} strokeWidth={1.5} />
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
              y={height - 8}
              fontSize={10}
              textAnchor="middle"
              fill="currentColor"
              opacity={0.45}
            >
              {label}
            </text>
          );
        })}

        <text
          x={4}
          y={padding.top + 4}
          fontSize={9}
          fill="currentColor"
          opacity={0.45}
        >
          {max}
        </text>
        <text
          x={4}
          y={height - padding.bottom + 2}
          fontSize={9}
          fill="currentColor"
          opacity={0.45}
        >
          0
        </text>
      </svg>
    </div>
  );
}

export function HourHeatmap({ data }: { data: Array<{ hour: number; count: number }> }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-stone-900 p-5">
      <h2 className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-stone-500 mb-4">
        Distribuição por hora do dia
      </h2>
      <div
        className="grid grid-cols-24 gap-1"
        style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}
      >
        {data.map((d) => {
          const intensity = d.count / max;
          return (
            <div
              key={d.hour}
              title={`${String(d.hour).padStart(2, "0")}:00 — ${d.count} msgs`}
              className="aspect-square rounded-sm transition-transform hover:scale-110"
              style={{
                backgroundColor:
                  d.count === 0
                    ? "rgba(120, 113, 108, 0.08)"
                    : `rgba(181, 73, 26, ${0.15 + intensity * 0.7})`,
              }}
            />
          );
        })}
      </div>
      <div className="mt-3 flex justify-between text-[10px] text-stone-400 tabular-nums">
        <span>00h</span>
        <span>06h</span>
        <span>12h</span>
        <span>18h</span>
        <span>23h</span>
      </div>
    </div>
  );
}
