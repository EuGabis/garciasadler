import { exatoFetch } from "./client";
import type { UsuarioIntegracaoLoja } from "./types";

/**
 * Lista lojas acessíveis pelo usuário Exato logado.
 * Não exige codigoAcesso (é como você OBTÉM o codigoAcesso).
 */
export async function listarLojas(workspaceId: string): Promise<UsuarioIntegracaoLoja[]> {
  return await exatoFetch<UsuarioIntegracaoLoja[]>({
    workspaceId,
    path: "/lojas",
    requireLoja: false,
  });
}
