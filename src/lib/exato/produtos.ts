import { exatoFetch } from "./client";
import type { ListarProdutosParams, ProdutoMecanizou } from "./types";
import { logger } from "@/lib/logger";

const log = logger("exato/produtos");
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

// ===================== BUSCA TOLERANTE =====================
// Implementa a seção 3.1 do system prompt v5:
// - Normaliza (lowercase + remove acentos + remove stopwords)
// - Substituições semânticas do domínio (ex: "3 quartos" → "3/4")
// - Tokeniza
// - Busca no Exato pelo token mais distintivo
// - Filtra localmente: descrição precisa conter TODOS os tokens

const STOPWORDS = new Set([
  "de", "do", "da", "dos", "das",
  "com", "para", "em", "no", "na",
  "e", "o", "a", "os", "as",
  "um", "uma", "uns", "umas",
]);

/**
 * Substituições semânticas comuns no vocabulário de materiais de construção.
 * Aplicadas ANTES de remover acentos / tokenizar.
 *
 * Cliente fala "3 quartos" mas a descrição no Exato é "3/4". Sem essas
 * substituições, a busca tolerante não casa.
 */
const SEMANTIC_SUBSTITUTIONS: Array<[RegExp, string]> = [
  // Frações populares (cliente fala, Exato cadastra)
  [/\b3\s+quartos?\b/gi, "3/4"],
  [/\bum\s+quarto\b/gi, "1/4"],
  [/\btres\s+oitavos?\b/gi, "3/8"],
  [/\btrês\s+oitavos?\b/gi, "3/8"],
  [/\bum\s+oitavo\b/gi, "1/8"],
  [/\bmeio\b/gi, "1/2"],
  [/\bmeia\b/gi, "1/2"],
  [/\bduas?\s+polegadas?\b/gi, "2"],

  // Apelidos do depósito Garcia Sadler (system prompt v6 §5.1.a).
  // Cliente fala "bloco 15" mas o cadastro é "BLOCO CONCRETO 14 X 19 X 39"
  // (apelido vem da largura arredondada ao múltiplo de 5 mais próximo).
  // Substituímos o apelido pra dimensão real ANTES de tokenizar.
  // Ordem importa: padrões mais específicos primeiro pra evitar match parcial.
  [/\bbloco\s+15\b/gi, "bloco 14"],
  [/\bbloco\s+10\b/gi, "bloco 9"],
  // "bloco 19" já bate exato com a descrição "19 X 19 X 39" — sem substituição.
];

function normalize(s: string): string {
  let n = s.toLowerCase().trim();
  // Aplica substituições semânticas
  for (const [pattern, replacement] of SEMANTIC_SUBSTITUTIONS) {
    n = n.replace(pattern, replacement);
  }
  // Remove acentos diacríticos (combining marks U+0300 a U+036F)
  n = n.normalize("NFD").replace(/[̀-ͯ]/g, "");
  return n;
}

function tokenize(s: string): string[] {
  return normalize(s)
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && !STOPWORDS.has(t));
}

/**
 * Escolhe o token mais distintivo (mais longo) pra usar como filtro inicial
 * no Exato. Tokens longos costumam ser substantivos (cotovelo, vergalhao,
 * argamassa) — muito mais seletivos que números ou bitolas curtas.
 */
function pickDistinctiveToken(tokens: string[]): string {
  return [...tokens].sort((a, b) => b.length - a.length)[0];
}

/**
 * Busca tolerante de produtos.
 *
 * Comportamento:
 * 1. Termo curto+sem espaço+com dígito (ex: CIM50, 1759) → tenta como código.
 * 2. Caso contrário (ou se código falhou) → tokeniza descrição:
 *    - 0 tokens (só stopwords) → [] vazio
 *    - 1 token → busca direta por descrição
 *    - 2+ tokens → busca Exato pelo token mais distintivo, depois filtra
 *      localmente por todos os tokens. Se filtro = 0, retorna [] (deixa a IA
 *      pedir refinamento, seguindo prompt v5 §5.1.d).
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

  // Heurística de código: <=6 chars, sem espaço, com dígito (ex: CIM50, 1759).
  const looksLikeCode = t.length <= 6 && !/\s/.test(t) && /\d/.test(t);
  if (looksLikeCode) {
    const byCode = await listarProdutos(workspaceId, {
      codigoProduto: t,
      pagina,
      tamanho,
    });
    if (byCode.length > 0) return byCode;
    // se zero, cai pro fluxo de descrição abaixo
  }

  const tokens = tokenize(t);
  if (tokens.length === 0) {
    log.info("tokenize empty (só stopwords)", { workspaceId, termo: t });
    return [];
  }

  // 1 token: busca direta por descrição.
  if (tokens.length === 1) {
    return await listarProdutos(workspaceId, {
      descricaoProduto: tokens[0],
      pagina,
      tamanho,
    });
  }

  // 2+ tokens: busca pelo mais distintivo, filtra localmente.
  // Se o primeiro token escolhido retornar zero do Exato, tenta o próximo
  // mais longo (até 2 tentativas). Resolve casos como "cimento de
  // assentamento": "assentamento" sozinho não bate nada no Exato (não está em
  // nenhuma descrição), então caímos pra "cimento" e filtramos localmente.
  const orderedTokens = [...tokens].sort((a, b) => b.length - a.length);
  const baseTamanho = Math.max(tamanho * 5, 100);

  let candidatos: ProdutoMecanizou[] = [];
  const triedTokens: string[] = [];
  for (const tok of orderedTokens.slice(0, 2)) {
    triedTokens.push(tok);
    const r = await listarProdutos(workspaceId, {
      descricaoProduto: tok,
      pagina: 1,
      tamanho: baseTamanho,
    });
    if (r.length > 0) {
      candidatos = r;
      break;
    }
  }

  log.info("multi-token search", {
    workspaceId,
    termoOriginal: t,
    tokens,
    triedTokens,
    candidatosTotal: candidatos.length,
  });

  if (candidatos.length === 0) {
    return [];
  }

  const filtered = candidatos.filter((p) => {
    const normDesc = normalize(p.descricao);
    return tokens.every((tok) => normDesc.includes(tok));
  });

  log.info("multi-token filtered", {
    workspaceId,
    candidatosTotal: candidatos.length,
    filteredTotal: filtered.length,
  });

  // Se nenhum candidato contém TODOS os tokens, retorna [] vazio.
  // O system prompt v5 §5.1.d manda a IA perguntar consultivamente nesse caso.
  return filtered.slice(0, tamanho);
}
