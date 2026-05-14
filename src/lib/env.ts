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
});

export const env = schema.parse(process.env);
export type Env = z.infer<typeof schema>;
