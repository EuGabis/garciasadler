import { env } from "@/lib/env";

export type EvolutionConfig = {
  url: string;
  key: string;
  instance: string;
};

function configFromEnv(): EvolutionConfig | null {
  if (!env.EVOLUTION_API_URL || !env.EVOLUTION_API_KEY || !env.EVOLUTION_INSTANCE) return null;
  return {
    url: env.EVOLUTION_API_URL,
    key: env.EVOLUTION_API_KEY,
    instance: env.EVOLUTION_INSTANCE,
  };
}

export async function sendWhatsAppText(
  to: string,
  text: string,
  config?: EvolutionConfig
): Promise<void> {
  const cfg = config ?? configFromEnv();
  if (!cfg) {
    throw new Error("Evolution API não configurada (workspace ou env)");
  }

  const url = `${cfg.url.replace(/\/$/, "")}/message/sendText/${encodeURIComponent(cfg.instance)}`;

  const r = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: cfg.key,
    },
    body: JSON.stringify({ number: to, text }),
  });

  if (!r.ok) {
    const body = await r.text().catch(() => "");
    throw new Error(`Evolution sendText falhou (${r.status}): ${body}`);
  }
}

export function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "").replace(/@.*$/, "");
}
