import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().url(),

  AUTH_SECRET: z.string().min(32),
  AUTH_URL: z.string().url().optional(),

  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),

  EVOLUTION_API_URL: z.string().url().optional(),
  EVOLUTION_API_KEY: z.string().min(1).optional(),
  EVOLUTION_INSTANCE: z.string().min(1).optional(),

  PRODUTOS_API_URL: z.string().url().optional(),
  PRODUTOS_API_KEY: z.string().optional(),

  WEBHOOK_SECRET: z.string().optional(),

  PUSHER_APP_ID: z.string().optional(),
  PUSHER_SECRET: z.string().optional(),
  NEXT_PUBLIC_PUSHER_KEY: z.string().optional(),
  NEXT_PUBLIC_PUSHER_CLUSTER: z.string().optional(),

  CRON_SECRET: z.string().optional(),
});

/**
 * Remove valores vazios pra que .optional() funcione no Zod.
 * Sem isso, env vars setadas como "" no .env/Vercel quebrariam .min(N).optional().
 */
function cleanEnv(source: NodeJS.ProcessEnv): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(source)) {
    if (typeof v === "string" && v.length > 0) out[k] = v;
  }
  return out;
}

export const env = schema.parse(cleanEnv(process.env));
export type Env = z.infer<typeof schema>;
