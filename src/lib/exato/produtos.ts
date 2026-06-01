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

  const pagina = opts.pagina ?? 1;
  const tamanho = opts.tamanho ?? DEFAULT_TAMANHO;

  // Heurística de código: até 6 chars, sem espaço E com pelo menos um dígito
  // (ex: CIM50, 1759). Palavras puras como "areia", "pedra", "tinta", "bloco"
  // NÃO são código — vão por descrição. (Antes, qualquer palavra <=6 letras
  // caía na busca por código e retornava zero, quebrando "areia"/"pedra".)
  const looksLikeCode = t.length <= 6 && !/\s/.test(t) && /\d/.test(t);

  if (looksLikeCode) {
    const byCode = await listarProdutos(workspaceId, { codigoProduto: t, pagina, tamanho });
    if (byCode.length > 0) return byCode;
    // Fallback: pode ser uma descrição curta. Tenta por descrição antes de desistir.
    return await listarProdutos(workspaceId, { descricaoProduto: t, pagina, tamanho });
  }

  return await listarProdutos(workspaceId, { descricaoProduto: t, pagina, tamanho });
}
