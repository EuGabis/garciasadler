import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { ExatoError, type TokenResponse } from "./types";

const BASE_URL = "https://apiexatointegracao.pmlsistemas.com.br";

/**
 * Parse "HH:MM:SS" (formato date-span do .NET) pra milissegundos.
 * Aceita também "D.HH:MM:SS" (dias prefixados).
 */
function parseTokenDuration(span: string): number {
  if (!span) return 60 * 60 * 1000; // fallback 1h
  const match = /^(?:(\d+)\.)?(\d{1,2}):(\d{2}):(\d{2})(?:\.\d+)?$/.exec(span);
  if (!match) return 60 * 60 * 1000;
  const [, days = "0", hh, mm, ss] = match;
  const ms =
    Number(days) * 86400000 + Number(hh) * 3600000 + Number(mm) * 60000 + Number(ss) * 1000;
  return ms > 0 ? ms : 60 * 60 * 1000;
}

async function loginRaw(usuario: string, senha: string): Promise<TokenResponse> {
  const r = await fetch(`${BASE_URL}/autenticacao/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ usuario, senha }),
  });
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new ExatoError(`Login Exato falhou (${r.status})`, r.status, text);
  }
  return (await r.json()) as TokenResponse;
}

async function refreshRaw(accessToken: string, refreshToken: string): Promise<TokenResponse> {
  const r = await fetch(`${BASE_URL}/autenticacao/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ refreshToken }),
  });
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new ExatoError(`Refresh Exato falhou (${r.status})`, r.status, text);
  }
  return (await r.json()) as TokenResponse;
}

/**
 * Garante token válido pro workspace.
 *
 * - Se há token em cache e não expirou, retorna direto
 * - Senão tenta refresh
 * - Se refresh falhar, faz login com usuario/senha
 *
 * Salva o token+refreshToken+expiraEm no DB.
 */
export async function ensureToken(workspaceId: string): Promise<{
  token: string;
  codigoAcesso: string | null;
}> {
  const integ = await prisma.integracaoExato.findUnique({
    where: { workspaceId },
  });
  if (!integ) {
    throw new ExatoError("Integração Exato não configurada pra este workspace", 412);
  }

  const now = new Date();
  const margin = 60 * 1000; // 60s de margem

  if (integ.tokenAtual && integ.tokenExpiraEm && integ.tokenExpiraEm.getTime() - margin > now.getTime()) {
    return { token: integ.tokenAtual, codigoAcesso: integ.lojaCodigoAcesso };
  }

  // Tenta refresh primeiro (mais barato)
  if (integ.tokenAtual && integ.refreshToken) {
    try {
      const t = await refreshRaw(integ.tokenAtual, integ.refreshToken);
      const expiraEm = new Date(Date.now() + parseTokenDuration(t.duracaoTokenEmHoras));
      const updated = await prisma.integracaoExato.update({
        where: { id: integ.id },
        data: {
          tokenAtual: t.token,
          refreshToken: t.refreshToken,
          tokenExpiraEm: expiraEm,
          ultimoErro: null,
        },
      });
      return { token: updated.tokenAtual!, codigoAcesso: updated.lojaCodigoAcesso };
    } catch (e) {
      // Refresh falhou — cai pro login full
      console.warn("[exato.auth] refresh falhou, refazendo login:", (e as Error).message);
    }
  }

  // Login full
  const senha = decrypt(integ.senhaEncrypted);
  const t = await loginRaw(integ.usuario, senha);
  const expiraEm = new Date(Date.now() + parseTokenDuration(t.duracaoTokenEmHoras));

  const updated = await prisma.integracaoExato.update({
    where: { id: integ.id },
    data: {
      tokenAtual: t.token,
      refreshToken: t.refreshToken,
      tokenExpiraEm: expiraEm,
      ultimoLoginEm: new Date(),
      ultimoErro: null,
    },
  });
  return { token: updated.tokenAtual!, codigoAcesso: updated.lojaCodigoAcesso };
}

/**
 * Testa credenciais sem mexer no DB. Útil pro botão "Testar conexão".
 */
export async function testarLogin(usuario: string, senha: string): Promise<TokenResponse> {
  return await loginRaw(usuario, senha);
}
