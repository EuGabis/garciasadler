/**
 * Wrapper sobre `src/lib/crypto.ts` pra credenciais sensíveis armazenadas no DB
 * (evolutionKey, futuras). Adiciona prefixo de versão pra distinguir valores
 * cifrados de plain text (legado, antes da migração).
 */
import { encrypt as rawEncrypt, decrypt as rawDecrypt } from "@/lib/crypto";
import { logger } from "@/lib/logger";

const log = logger("secrets");
const PREFIX = "enc:v1:";

export function encryptSecret(plain: string): string {
  if (!plain) return plain;
  return PREFIX + rawEncrypt(plain);
}

export function decryptSecret(stored: string | null | undefined): string | null {
  if (!stored) return null;
  if (stored.startsWith(PREFIX)) {
    try {
      return rawDecrypt(stored.slice(PREFIX.length));
    } catch (e) {
      log.error("decrypt failed", e);
      return null;
    }
  }
  // Legacy plain — retorna pra compatibilidade enquanto migração não rodou
  return stored;
}

export function isEncryptedSecret(value: string | null | undefined): boolean {
  return !!value && value.startsWith(PREFIX);
}

export function maskSecret(value: string | null | undefined): string {
  if (!value) return "";
  if (value.length <= 8) return "•".repeat(value.length);
  return `${value.slice(0, 4)}${"•".repeat(Math.max(0, value.length - 8))}${value.slice(-4)}`;
}
