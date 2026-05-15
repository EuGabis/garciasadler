import { auth } from "@/auth";
import { getMetrics, formatDuration, type AnalyticsPeriod } from "@/lib/analytics";
import { KpiCard, BarList, MessagesChart, HourHeatmap } from "./charts";
import { PeriodTabs } from "./period-tabs";

export const dynamic = "force-dynamic";

type Search = { period?: string };

function validPeriod(s: string | undefined): AnalyticsPeriod {
  if (s === "today" || s === "7d" || s === "30d" || s === "90d") return s;
  return "7d";
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const session = await auth();
  const params = await searchParams;
  const period = validPeriod(params.period);
  const metrics = await getMetrics(session!.user.workspaceId, period);

  const respRate =
    metrics.totals.inboundMessages > 0
      ? Math.round((metrics.totals.outboundMessages / metrics.totals.inboundMessages) * 100)
      : 0;

  return (
    <div className="p-8 max-w-6xl">
      <header className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {metrics.period.label} ·{" "}
            {metrics.period.from.toLocaleDateString("pt-BR")} →{" "}
            {metrics.period.to.toLocaleDateString("pt-BR")}
          </p>
        </div>
        <PeriodTabs active={period} />
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KpiCard
          label="Novas conversas"
          value={metrics.totals.newConversations}
          hint={`${metrics.totals.conversations} no total`}
        />
        <KpiCard
          label="Contatos ativos"
          value={metrics.totals.activeContacts}
          hint="com mensagem no período"
        />
        <KpiCard
          label="Resolvidas"
          value={metrics.totals.resolvedConversations}
          hint="status = resolved"
        />
        <KpiCard
          label="Tempo médio de resposta"
          value={formatDuration(metrics.totals.avgFirstResponseSeconds)}
          hint="1ª inbound → 1ª outbound"
        />
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        <KpiCard
          label="Mensagens recebidas"
          value={metrics.totals.inboundMessages}
        />
        <KpiCard
          label="Mensagens enviadas"
          value={metrics.totals.outboundMessages}
        />
        <KpiCard
          label="Taxa de resposta"
          value={`${respRate}%`}
          hint="enviadas / recebidas"
        />
      </section>

      <section className="mb-6">
        <MessagesChart data={metrics.byDay} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
        <BarList
          title="Top agentes"
          items={metrics.byAgent.map((a) => ({
            label: a.name,
            value: a.outboundCount,
          }))}
          emptyText="Nenhum agente respondeu no período."
        />
        <BarList
          title="Etiquetas mais usadas"
          items={metrics.byLabel.map((l) => ({
            label: l.name,
            value: l.count,
            color: l.color,
          }))}
          emptyText="Nenhuma conversa etiquetada."
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
        <BarList
          title="Distribuição no pipeline"
          items={metrics.byColumn.map((c) => ({
            label: c.name,
            value: c.cardCount,
            color: c.color,
          }))}
          emptyText="Pipeline vazio."
        />
        <HourHeatmap data={metrics.byHour} />
      </section>
    </div>
  );
}
