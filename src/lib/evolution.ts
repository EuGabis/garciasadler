import { env } from "@/lib/env";

export async function sendWhatsAppText(to: string, text: string): Promise<void> {
  const url = `${env.EVOLUTION_API_URL}/message/sendText/${env.EVOLUTION_INSTANCE}`;

  const r = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: env.EVOLUTION_API_KEY,
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
