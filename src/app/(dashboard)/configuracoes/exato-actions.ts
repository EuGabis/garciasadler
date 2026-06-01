"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { encrypt } from "@/lib/crypto";
import { canManageTeam } from "@/lib/team";
import { testarLogin } from "@/lib/exato/auth";
import { listarLojas } from "@/lib/exato/lojas";
import { buscarProdutos } from "@/lib/exato/produtos";
import { ExatoError } from "@/lib/exato/types";

// ----- save credentials -----

const saveSchema = z.object({
  usuario: z.string().min(1).max(120),
  senha: z.string().min(1).max(200),
});

export type ExatoSaveState = { error?: string; ok?: boolean } | null;

export async function saveExatoCredentialsAction(
  _prev: ExatoSaveState,
  formData: FormData
): Promise<ExatoSaveState> {
  const session = await auth();
  if (!session?.user) return { error: "Não autenticado." };
  if (!canManageTeam(session.user.role)) return { error: "Sem permissão." };

  const parsed = saveSchema.safeParse({
    usuario: formData.get("usuario"),
    senha: formData.get("senha"),
  });
  if (!parsed.success) return { error: "Dados inválidos." };

  // Testa antes de salvar — evita persistir credencial errada
  try {
    await testarLogin(parsed.data.usuario, parsed.data.senha);
  } catch (e) {
    const msg = e instanceof ExatoError ? `Login falhou (${e.status}).` : "Login falhou.";
    return { error: msg };
  }

  const senhaEncrypted = encrypt(parsed.data.senha);

  await prisma.integracaoExato.upsert({
    where: { workspaceId: session.user.workspaceId },
    update: {
      usuario: parsed.data.usuario,
      senhaEncrypted,
      // Limpa cache de token e erro anterior pra forçar novo login
      tokenAtual: null,
      refreshToken: null,
      tokenExpiraEm: null,
      ultimoErro: null,
    },
    create: {
      workspaceId: session.user.workspaceId,
      usuario: parsed.data.usuario,
      senhaEncrypted,
    },
  });

  revalidatePath("/configuracoes");
  return { ok: true };
}

// ----- test connection -----

export type ExatoTestState = { error?: string; ok?: boolean; nomeUsuarioLogado?: string } | null;

export async function testExatoConnectionAction(): Promise<ExatoTestState> {
  const session = await auth();
  if (!session?.user) return { error: "Não autenticado." };

  const integ = await prisma.integracaoExato.findUnique({
    where: { workspaceId: session.user.workspaceId },
  });
  if (!integ) return { error: "Credenciais ainda não salvas." };

  try {
    const { decrypt } = await import("@/lib/crypto");
    const senha = decrypt(integ.senhaEncrypted);
    const t = await testarLogin(integ.usuario, senha);
    return { ok: true, nomeUsuarioLogado: t.nomeUsuarioLogado };
  } catch (e) {
    const msg = e instanceof ExatoError ? `Login falhou (${e.status}).` : (e as Error).message;
    await prisma.integracaoExato.update({
      where: { id: integ.id },
      data: { ultimoErro: msg },
    });
    return { error: msg };
  }
}

// ----- sync lojas + escolher loja -----

export type ExatoLoja = {
  codigoAcesso: string;
  id: number;
  nome: string;
  nomeFantasia: string | null;
  cidade: string | null;
  uf: string | null;
};

export type ExatoSyncLojasState =
  | { error?: string; lojas?: ExatoLoja[] }
  | null;

export async function syncExatoLojasAction(): Promise<ExatoSyncLojasState> {
  const session = await auth();
  if (!session?.user) return { error: "Não autenticado." };

  try {
    const arr = await listarLojas(session.user.workspaceId);
    return {
      lojas: arr.map((u) => ({
        codigoAcesso: u.codigoAcesso,
        id: u.loja.id,
        nome: u.loja.nome ?? "",
        nomeFantasia: u.loja.nomeFantasia ?? null,
        cidade: u.loja.endereco?.cidade ?? null,
        uf: u.loja.endereco?.uf ?? null,
      })),
    };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

const selectLojaSchema = z.object({
  codigoAcesso: z.string().uuid(),
  lojaId: z.coerce.number().int().positive(),
  lojaNome: z.string().min(1).max(200),
});

export type ExatoSelectLojaState = { error?: string; ok?: boolean } | null;

export async function selectExatoLojaAction(
  _prev: ExatoSelectLojaState,
  formData: FormData
): Promise<ExatoSelectLojaState> {
  const session = await auth();
  if (!session?.user) return { error: "Não autenticado." };
  if (!canManageTeam(session.user.role)) return { error: "Sem permissão." };

  const parsed = selectLojaSchema.safeParse({
    codigoAcesso: formData.get("codigoAcesso"),
    lojaId: formData.get("lojaId"),
    lojaNome: formData.get("lojaNome"),
  });
  if (!parsed.success) return { error: "Loja inválida." };

  await prisma.integracaoExato.update({
    where: { workspaceId: session.user.workspaceId },
    data: {
      lojaId: parsed.data.lojaId,
      lojaNome: parsed.data.lojaNome,
      lojaCodigoAcesso: parsed.data.codigoAcesso,
    },
  });

  revalidatePath("/configuracoes");
  return { ok: true };
}

// ----- search produto (teste) -----

export type ExatoProduto = {
  id: number;
  codigo: string;
  descricao: string;
  marca: string | null;
  precoVenda: number;
  estoque: number;
  unidade: string | null;
};

export type ExatoSearchState =
  | { error?: string; produtos?: ExatoProduto[]; termo?: string }
  | null;

export async function searchExatoProdutoAction(
  _prev: ExatoSearchState,
  formData: FormData
): Promise<ExatoSearchState> {
  const session = await auth();
  if (!session?.user) return { error: "Não autenticado." };

  const termo = String(formData.get("termo") ?? "").trim();
  if (!termo) return { error: "Digite um termo." };

  // Surface o corpo da resposta do Exato (ex: motivo real do 500), que de
  // outra forma fica escondido — essencial pra diagnosticar.
  const fmtErr = (e: unknown) => {
    let detail = "";
    if (e instanceof ExatoError && e.body != null) {
      const raw = typeof e.body === "string" ? e.body : JSON.stringify(e.body);
      if (raw) detail = ` — ${raw.slice(0, 300)}`;
    }
    return `${(e as Error).message}${detail}`;
  };

  try {
    const arr = await buscarProdutos(session.user.workspaceId, termo, { tamanho: 20 });
    return {
      termo,
      produtos: arr.map((p) => ({
        id: p.id,
        codigo: p.codigo,
        descricao: p.descricao,
        marca: p.marca,
        precoVenda: p.precoVenda,
        estoque: p.quantidadeDisponivelVenda,
        unidade: p.unidadeMedida,
      })),
    };
  } catch (e) {
    return { error: fmtErr(e), termo };
  }
}
