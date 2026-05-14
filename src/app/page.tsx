import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

async function getStats() {
  try {
    const [conversations, messages, lastMessage] = await Promise.all([
      prisma.conversation.count(),
      prisma.message.count(),
      prisma.message.findFirst({ orderBy: { createdAt: "desc" } }),
    ]);
    return { ok: true as const, conversations, messages, lastMessage };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
}

export default async function Home() {
  const stats = await getStats();
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight">Garcia Bot</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Atendimento WhatsApp via OpenAI + Evolution
        </p>

        <section className="mt-8 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
          <h2 className="text-lg font-semibold">Status</h2>
          {stats.ok ? (
            <dl className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-zinc-500">Conversas</dt>
                <dd className="text-2xl font-medium">{stats.conversations}</dd>
              </div>
              <div>
                <dt className="text-sm text-zinc-500">Mensagens</dt>
                <dd className="text-2xl font-medium">{stats.messages}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-sm text-zinc-500">Última atividade</dt>
                <dd className="text-sm">
                  {stats.lastMessage
                    ? new Date(stats.lastMessage.createdAt).toLocaleString("pt-BR")
                    : "—"}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-4 text-red-500 text-sm">
              Banco indisponível: {stats.error}
            </p>
          )}
        </section>

        <section className="mt-6 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
          <h2 className="text-lg font-semibold">Webhook</h2>
          <code className="block mt-2 text-sm bg-zinc-100 dark:bg-zinc-900 p-3 rounded">
            POST /api/webhook
          </code>
          <p className="mt-2 text-sm text-zinc-500">
            Configure essa URL no painel da sua instância Evolution, evento{" "}
            <code>messages.upsert</code>.
          </p>
        </section>
      </div>
    </main>
  );
}
