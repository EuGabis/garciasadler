/**
 * Calculadora de obra - fórmulas práticas usadas em loja de material de construção.
 *
 * Todas as funções recebem dimensões e devolvem a lista de materiais necessários
 * com quantidade + unidade. A IA combina isso com `buscar_produto` pra gerar
 * cotação final.
 *
 * Referências:
 * - Contrapiso traço 1:4 (cimento:areia) + 5cm espessura
 * - Alvenaria com tijolo 9 furos 9x19x19 + argamassa 1:2:6
 * - Reboco 2cm com argamassa 1:2:8
 * - Telhado cerâmico ~17 telhas/m²
 */

export type MaterialQty = {
  produto: string;
  quantidade: number;
  unidade: "saco" | "m3" | "kg" | "unidade" | "milheiro" | "barra" | "rolo" | "balde" | "lata";
  obs?: string;
};

export type ObraResult = {
  tipo: string;
  dimensoes: Record<string, number>;
  materiais: MaterialQty[];
  observacoes: string[];
};

// ============================================================
// Contrapiso (5cm espessura padrão, traço 1:4 cimento:areia + brita)
// ============================================================

export function contrapiso(areaM2: number, espessuraCm = 5): ObraResult {
  const volumeM3 = (areaM2 * espessuraCm) / 100;

  // Traço 1:4 com 5% de perda
  const cimentoSacos = Math.ceil(volumeM3 * 7 * 1.05); // ~7 sacos 50kg/m³
  const areiaM3 = Math.ceil((volumeM3 * 0.9 * 1.05) * 100) / 100;
  const britaKg = Math.ceil(volumeM3 * 80); // pequena adição

  return {
    tipo: "contrapiso",
    dimensoes: { areaM2, espessuraCm },
    materiais: [
      { produto: "Cimento CP-II 50kg", quantidade: cimentoSacos, unidade: "saco" },
      { produto: "Areia média", quantidade: areiaM3, unidade: "m3" },
      { produto: "Brita 1", quantidade: britaKg, unidade: "kg", obs: "para reforço" },
    ],
    observacoes: [
      `Volume total: ${volumeM3.toFixed(2)} m³`,
      "Inclui 5% de perda na obra",
      "Traço 1:4 (cimento:areia)",
    ],
  };
}

// ============================================================
// Alvenaria (parede de tijolo 9 furos 9x19x19)
// ============================================================

export function alvenaria(comprimentoM: number, alturaM: number): ObraResult {
  const areaM2 = comprimentoM * alturaM;
  // 9x19x19 cobre ~0,036m² cada (com junta de 1cm) → 28 tijolos/m²
  const tijolos = Math.ceil(areaM2 * 28 * 1.07); // 7% perda
  const argamassaM3 = Math.ceil(areaM2 * 0.025 * 100) / 100;
  // Argamassa 1:2:6 → cimento + areia + cal
  const cimentoSacos = Math.ceil(argamassaM3 * 6);
  const areiaM3 = Math.ceil(argamassaM3 * 1.2 * 100) / 100;
  const calKg = Math.ceil(argamassaM3 * 80);

  return {
    tipo: "alvenaria",
    dimensoes: { comprimentoM, alturaM, areaM2 },
    materiais: [
      { produto: "Tijolo cerâmico 9 furos 9x19x19", quantidade: tijolos, unidade: "unidade" },
      { produto: "Cimento CP-II 50kg", quantidade: cimentoSacos, unidade: "saco", obs: "argamassa de assentamento" },
      { produto: "Areia média", quantidade: areiaM3, unidade: "m3" },
      { produto: "Cal hidratada", quantidade: calKg, unidade: "kg" },
    ],
    observacoes: [
      `Área de parede: ${areaM2.toFixed(2)} m²`,
      `${tijolos} tijolos com 7% de perda incluída`,
      "Argamassa traço 1:2:6 (cimento:cal:areia)",
    ],
  };
}

// ============================================================
// Reboco (2cm espessura, argamassa 1:2:8)
// ============================================================

export function reboco(areaM2: number, espessuraCm = 2, lados = 1): ObraResult {
  const areaTotal = areaM2 * lados;
  const volumeM3 = (areaTotal * espessuraCm) / 100;
  const cimentoSacos = Math.ceil(volumeM3 * 4.5);
  const areiaM3 = Math.ceil(volumeM3 * 1.4 * 100) / 100;
  const calKg = Math.ceil(volumeM3 * 60);

  return {
    tipo: "reboco",
    dimensoes: { areaM2, espessuraCm, lados },
    materiais: [
      { produto: "Cimento CP-II 50kg", quantidade: cimentoSacos, unidade: "saco" },
      { produto: "Areia fina", quantidade: areiaM3, unidade: "m3" },
      { produto: "Cal hidratada", quantidade: calKg, unidade: "kg" },
    ],
    observacoes: [
      `Área total: ${areaTotal.toFixed(2)} m² (${lados} lado${lados > 1 ? "s" : ""})`,
      "Argamassa 1:2:8 (cimento:cal:areia)",
    ],
  };
}

// ============================================================
// Telhado (cerâmico)
// ============================================================

export function telhado(areaM2: number, tipoTelha: "ceramica" | "fibrocimento" = "ceramica"): ObraResult {
  if (tipoTelha === "ceramica") {
    const telhas = Math.ceil(areaM2 * 17 * 1.05); // 17 telhas/m² + 5% perda
    return {
      tipo: "telhado-ceramica",
      dimensoes: { areaM2 },
      materiais: [
        { produto: "Telha cerâmica colonial", quantidade: telhas, unidade: "unidade" },
      ],
      observacoes: [
        `${telhas} telhas com 5% de perda`,
        "Considere também ripas, caibros e cumeeiras",
      ],
    };
  }
  // Fibrocimento 2.44m x 1.10m = 2.68m² cada, sobreposição reduz a 2.0m²
  const placas = Math.ceil(areaM2 / 2);
  return {
    tipo: "telhado-fibrocimento",
    dimensoes: { areaM2 },
    materiais: [{ produto: "Telha de fibrocimento 2,44m", quantidade: placas, unidade: "unidade" }],
    observacoes: [`${placas} placas considerando sobreposição`],
  };
}

// ============================================================
// Pintura (tinta acrílica ~10m²/L com 2 demãos)
// ============================================================

export function pintura(areaM2: number, demaos = 2): ObraResult {
  const litros = Math.ceil((areaM2 * demaos) / 10);
  // 18L = balde grande
  const baldes = Math.ceil(litros / 18);
  return {
    tipo: "pintura",
    dimensoes: { areaM2, demaos },
    materiais: [
      { produto: "Tinta acrílica 18L", quantidade: baldes, unidade: "balde" },
      { produto: "Massa corrida 25kg", quantidade: Math.ceil(areaM2 / 30), unidade: "balde", obs: "se for em massa nova" },
    ],
    observacoes: [
      `~${litros}L de tinta pra ${areaM2}m² em ${demaos} demãos`,
      "Considere lixa, rolo, fita crepe e lona de proteção",
    ],
  };
}

// ============================================================
// Concreto (vigas, lajes, pilares) - traço 1:2:3 (cimento:areia:brita)
// ============================================================

export function concreto(volumeM3: number): ObraResult {
  const cimentoSacos = Math.ceil(volumeM3 * 7 * 1.05);
  const areiaM3 = Math.ceil(volumeM3 * 0.7 * 100) / 100;
  const britaM3 = Math.ceil(volumeM3 * 0.9 * 100) / 100;
  return {
    tipo: "concreto",
    dimensoes: { volumeM3 },
    materiais: [
      { produto: "Cimento CP-II 50kg", quantidade: cimentoSacos, unidade: "saco" },
      { produto: "Areia média", quantidade: areiaM3, unidade: "m3" },
      { produto: "Brita 1", quantidade: britaM3, unidade: "m3" },
    ],
    observacoes: [
      `Concreto estrutural traço 1:2:3 - ${volumeM3} m³`,
      "Acréscimo de 5% pra perda",
      "Para vergalhão de aço, informe a estrutura (viga/laje/pilar)",
    ],
  };
}

// ============================================================
// Aço CA-50 (ferragem)
// ============================================================

export function aco(elemento: "viga" | "pilar" | "laje", quantidadeM: number, bitolaMm = 8): ObraResult {
  // Aproximação simplificada: 4 barras 8mm por viga/pilar/m, ou tela em laje
  const barras = Math.ceil((elemento === "laje" ? quantidadeM * 6 : quantidadeM * 4) * 1.05);
  return {
    tipo: `aco-${elemento}`,
    dimensoes: { quantidadeM, bitolaMm },
    materiais: [
      { produto: `Vergalhão aço CA-50 ${bitolaMm}mm 12m`, quantidade: barras, unidade: "barra" },
      { produto: "Arame recozido 18", quantidade: Math.ceil(barras * 0.2), unidade: "kg" },
    ],
    observacoes: [
      `${elemento} de ${quantidadeM}m - ferragem CA-50 ${bitolaMm}mm`,
      "Bitolas variam conforme cálculo estrutural. Confirme com engenheiro.",
    ],
  };
}
