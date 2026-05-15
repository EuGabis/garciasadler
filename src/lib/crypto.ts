import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHash,
} from "node:crypto";

/**
 * AES-256-GCM com chave derivada de INTEGRATION_ENCRYPTION_KEY.
 *
 * - Chave precisa ter pelo menos 32 chars (qualquer string, é normalizada via SHA-256).
 * - IV aleatório de 12 bytes por encrypt.
 * - Auth tag (16 bytes) embutida no resultado.
 *
 * Formato do retorno: base64(iv | authTag | ciphertext)
 *
 * Pra gerar a chave:
 *   openssl rand -hex 32
 */

function getKey(): Buffer {
  const raw = process.env.INTEGRATION_ENCRYPTION_KEY;
  if (!raw || raw.length < 32) {
    throw new Error(
      "INTEGRATION_ENCRYPTION_KEY ausente ou muito curta (min 32 chars). Gere com: openssl rand -hex 32"
    );
  }
  // Normaliza pra 32 bytes via SHA-256
  return createHash("sha256").update(raw).digest();
}

export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decrypt(payload: string): string {
  const key = getKey();
  const buf = Buffer.from(payload, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const enc = buf.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
  return dec.toString("utf8");
}
