import { prisma } from "@/lib/db";
import { decryptSecret } from "@/lib/secrets";

export type EvolutionConfig = {
  url: string;
  key: string;
  instance: string;
};

/**
 * Lê e descriptografa a config do Evolution do workspace.
 * Retorna null se algum dos campos estiver vazio ou se decrypt falhar.
 */
export async function getEvolutionConfig(workspaceId: string): Promise<EvolutionConfig | null> {
  const ws = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { evolutionUrl: true, evolutionKey: true, evolutionInstance: true },
  });
  if (!ws) return null;
  return buildEvolutionConfig(ws.evolutionUrl, ws.evolutionKey, ws.evolutionInstance);
}

export function buildEvolutionConfig(
  url: string | null | undefined,
  encryptedKey: string | null | undefined,
  instance: string | null | undefined
): EvolutionConfig | null {
  if (!url || !encryptedKey || !instance) return null;
  const key = decryptSecret(encryptedKey);
  if (!key) return null;
  return { url, key, instance };
}
