import { ensureToken } from "./auth";
import { ExatoError } from "./types";

const BASE_URL = "https://apiexatointegracao.pmlsistemas.com.br";

type RequestOptions = {
  workspaceId: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  query?: Record<string, string | number | undefined | null>;
  body?: unknown;
  /** Quando true, envia o header codigoAcesso. Default true. */
  requireLoja?: boolean;
};

function buildQuery(q?: RequestOptions["query"]): string {
  if (!q) return "";
  const parts: string[] = [];
  for (const [k, v] of Object.entries(q)) {
    if (v === undefined || v === null || v === "") continue;
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  }
  return parts.length ? `?${parts.join("&")}` : "";
}

/**
 * Wrapper HTTP autenticado contra a API Exato.
 *
 * - Garante token válido (refresh automático)
 * - Em 401, retenta uma vez forçando refresh
 * - Envia header codigoAcesso quando requireLoja=true (default)
 */
export async function exatoFetch<T>(opts: RequestOptions): Promise<T> {
  const requireLoja = opts.requireLoja ?? true;

  async function doFetch(token: string, codigoAcesso: string | null): Promise<Response> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    };
    if (opts.body) headers["Content-Type"] = "application/json";
    if (requireLoja) {
      if (!codigoAcesso) {
        throw new ExatoError(
          "Loja não configurada pra este workspace. Rode 'Sincronizar lojas' primeiro.",
          412
        );
      }
      headers["codigoAcesso"] = codigoAcesso;
    }

    const url = `${BASE_URL}${opts.path}${buildQuery(opts.query)}`;
    return await fetch(url, {
      method: opts.method ?? "GET",
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
  }

  let { token, codigoAcesso } = await ensureToken(opts.workspaceId);
  let r = await doFetch(token, codigoAcesso);

  if (r.status === 401) {
    // Token pode ter sido revogado. Força refresh marcando o cache como expirado.
    const { prisma } = await import("@/lib/db");
    await prisma.integracaoExato.update({
      where: { workspaceId: opts.workspaceId },
      data: { tokenExpiraEm: new Date(0) },
    });
    ({ token, codigoAcesso } = await ensureToken(opts.workspaceId));
    r = await doFetch(token, codigoAcesso);
  }

  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new ExatoError(`Exato ${opts.method ?? "GET"} ${opts.path} falhou (${r.status})`, r.status, text);
  }

  if (r.status === 204) return undefined as T;
  return (await r.json()) as T;
}
