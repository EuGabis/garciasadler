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

export type EvolutionMediaType = "image" | "video" | "document" | "audio";

export async function sendWhatsAppMedia(
  params: {
    to: string;
    mediaType: EvolutionMediaType;
    base64: string;
    mimeType: string;
    fileName: string;
    caption?: string;
  },
  config?: EvolutionConfig
): Promise<void> {
  const cfg = config ?? configFromEnv();
  if (!cfg) throw new Error("Evolution API não configurada");

  const base = cfg.url.replace(/\/$/, "");
  const instance = encodeURIComponent(cfg.instance);

  if (params.mediaType === "audio") {
    const r = await fetch(`${base}/message/sendWhatsAppAudio/${instance}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: cfg.key },
      body: JSON.stringify({ number: params.to, audio: params.base64 }),
    });
    if (!r.ok) {
      const body = await r.text().catch(() => "");
      throw new Error(`Evolution sendWhatsAppAudio falhou (${r.status}): ${body}`);
    }
    return;
  }

  const r = await fetch(`${base}/message/sendMedia/${instance}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: cfg.key },
    body: JSON.stringify({
      number: params.to,
      mediatype: params.mediaType,
      mimetype: params.mimeType,
      caption: params.caption ?? "",
      media: params.base64,
      fileName: params.fileName,
    }),
  });

  if (!r.ok) {
    const body = await r.text().catch(() => "");
    throw new Error(`Evolution sendMedia falhou (${r.status}): ${body}`);
  }
}

export function detectMediaType(mime: string): EvolutionMediaType {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return "document";
}

export function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "").replace(/@.*$/, "");
}
