"use server";

import { auth } from "@/auth";
import { logger } from "@/lib/logger";

type Input = {
  scope: string;
  message: string;
  stack: string | null;
  digest: string | null;
  url: string | null;
};

/**
 * Reporta um erro de client component (capturado por error.tsx)
 * pro logger server-side, que persiste em ErrorLog.
 */
export async function reportClientError(input: Input): Promise<void> {
  const session = await auth().catch(() => null);
  const log = logger(input.scope, {
    workspaceId: session?.user?.workspaceId ?? null,
    userId: session?.user?.id ?? null,
    url: input.url,
    digest: input.digest,
  });

  // Cria um "Error" sintético pra capturar nome+stack no logger.
  const fakeErr = new Error(input.message);
  if (input.stack) fakeErr.stack = input.stack;
  fakeErr.name = "ClientError";

  log.error("client component error", fakeErr);
}
