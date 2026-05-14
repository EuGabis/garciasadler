import { env } from "@/lib/env";

export type Produto = {
  sku: string;
  nome: string;
  categoria: string;
  unidade: string;
  preco: number;
  estoque: number;
  descricao?: string;
};

const MOCK_PRODUTOS: Produto[] = [
  { sku: "CIM-50", nome: "Cimento CP-II 50kg", categoria: "Cimento", unidade: "saco", preco: 38.9, estoque: 240, descricao: "Cimento Portland CP-II-E-32, saco de 50kg" },
  { sku: "AREIA-M3", nome: "Areia média lavada", categoria: "Agregados", unidade: "m³", preco: 95.0, estoque: 60, descricao: "Areia média lavada, ideal para reboco e contrapiso" },
  { sku: "BRITA-1", nome: "Brita nº 1", categoria: "Agregados", unidade: "m³", preco: 110.0, estoque: 45 },
  { sku: "TIJ-9F", nome: "Tijolo cerâmico 9 furos 9x19x19", categoria: "Cerâmica", unidade: "milheiro", preco: 880.0, estoque: 12 },
  { sku: "BLO-14", nome: "Bloco de concreto estrutural 14x19x39", categoria: "Cerâmica", unidade: "unidade", preco: 4.2, estoque: 1500 },
  { sku: "TUB-50", nome: 'Tubo PVC esgoto 50mm 6m', categoria: "Hidráulica", unidade: "barra", preco: 49.9, estoque: 80 },
  { sku: "FIO-25", nome: "Fio flexível 2,5mm² 100m", categoria: "Elétrica", unidade: "rolo", preco: 165.0, estoque: 30 },
  { sku: "TIN-18", nome: "Tinta acrílica fosca branca 18L", categoria: "Pintura", unidade: "balde", preco: 289.0, estoque: 22 },
];

function isMockMode(): boolean {
  return !env.PRODUTOS_API_URL;
}

export async function buscarProduto(termo: string): Promise<Produto | { erro: string }> {
  if (isMockMode()) {
    const t = termo.toLowerCase().trim();
    const found = MOCK_PRODUTOS.find(
      p => p.sku.toLowerCase() === t || p.nome.toLowerCase().includes(t)
    );
    return found ?? { erro: `Nenhum produto encontrado com termo "${termo}"` };
  }

  const url = `${env.PRODUTOS_API_URL}/produtos/${encodeURIComponent(termo)}`;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (env.PRODUTOS_API_KEY) headers.Authorization = `Bearer ${env.PRODUTOS_API_KEY}`;

  try {
    const r = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
    if (r.status === 404) return { erro: `Produto "${termo}" não encontrado` };
    if (!r.ok) return { erro: `Erro ${r.status} ao consultar API de produtos` };
    return (await r.json()) as Produto;
  } catch (e) {
    return { erro: `Falha ao consultar API: ${(e as Error).message}` };
  }
}

export async function listarPorCategoria(categoria: string): Promise<Produto[] | { erro: string }> {
  if (isMockMode()) {
    const c = categoria.toLowerCase().trim();
    const found = MOCK_PRODUTOS.filter(p => p.categoria.toLowerCase().includes(c));
    if (found.length === 0) return { erro: `Nenhum produto na categoria "${categoria}"` };
    return found;
  }

  const url = `${env.PRODUTOS_API_URL}/produtos?categoria=${encodeURIComponent(categoria)}`;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (env.PRODUTOS_API_KEY) headers.Authorization = `Bearer ${env.PRODUTOS_API_KEY}`;

  try {
    const r = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
    if (!r.ok) return { erro: `Erro ${r.status} ao listar categoria` };
    return (await r.json()) as Produto[];
  } catch (e) {
    return { erro: `Falha ao consultar API: ${(e as Error).message}` };
  }
}
