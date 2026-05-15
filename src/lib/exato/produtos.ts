import { exatoFetch } from "./client";
import type { ListarProdutosParams, ProdutoMecanizou } from "./types";

const DEFAULT_TAMANHO = 50;

export async function listarProdutos(
  workspaceId: string,
  params: Partial<ListarProdutosParams> = {}
): Promise<ProdutoMecanizou[]> {
  return await exatoFetch<ProdutoMecanizou[]>({
    workspaceId,
    path: "/produtos",
    query: {
      data: params.data,
      codigoProduto: params.codigoProduto,
      descricaoProduto: params.descricaoProduto,
      aplicacaoProduto: params.aplicacaoProduto,
      marcaProduto: params.marcaProduto,
      pagina: params.pagina ?? 1,
      tamanho: params.tamanho ?? DEFAULT_TAMANHO,
    },
  });
}

/**
 * Busca inteligente: decide se é código (curto/alfanumérico) ou descrição.
 * Códigos têm max 6 chars na API Exato.
 */
export async function buscarProdutos(
  workspaceId: string,
  termo: string,
  opts: { pagina?: number; tamanho?: number } = {}
): Promise<ProdutoMecanizou[]> {
  const t = termo.trim();
  if (!t) return [];

  // Heurística: <= 6 chars e parece código (sem espaços) → busca por código
  const looksLikeCode = t.length <= 6 && !/\s/.test(t);

  return await listarProdutos(workspaceId, {
    [looksLikeCode ? "codigoProduto" : "descricaoProduto"]: t,
    pagina: opts.pagina ?? 1,
    tamanho: opts.tamanho ?? DEFAULT_TAMANHO,
  });
}
