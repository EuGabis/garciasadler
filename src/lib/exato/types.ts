/**
 * Tipos da API Exato Integração (PML Sistemas).
 * Refletem o OpenAPI spec disponível em:
 *   https://apiexatointegracao.pmlsistemas.com.br/swagger/v1/swagger.json
 */

export type LoginRequest = {
  usuario: string;
  senha: string;
};

export type TokenResponse = {
  token: string;
  refreshToken: string;
  duracaoTokenEmHoras: string; // formato date-span "HH:MM:SS"
  nomeUsuarioLogado: string;
  mensagem?: string[];
};

export type RefreshRequest = {
  refreshToken: string;
};

export type EnderecoLoja = {
  id: number;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  cep: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
};

export type LojaDTO = {
  id: number;
  nome: string | null;
  nomeFantasia: string | null;
  endereco: EnderecoLoja;
};

export type UsuarioIntegracaoLoja = {
  codigoAcesso: string; // uuid
  loja: LojaDTO;
};

export type ProdutoMecanizou = {
  id: number;
  idLoja: number;
  codigo: string;
  codigoReferencia: string | null;
  marca: string | null;
  codigoFabricante: string | null;
  descricao: string;
  grupo: string | null;
  quantidadeDisponivelVenda: number;
  precoVenda: number;
  precoReposicao: number;
  dataCadastro: string;
  markUpCalculoPrecoVenda: number;
  ncm: string | null;
  unidadeMedida: string | null;
  aplicacao: string | null;
  quantidadeEmbalagem: number | null;
  dataUltimaAlteracao: string;
};

export type ListarProdutosParams = {
  data?: string; // yyyyMMddHHmm
  codigoProduto?: string;
  descricaoProduto?: string;
  aplicacaoProduto?: string;
  marcaProduto?: string;
  pagina: number;
  tamanho: number;
};

export type PreVendaItem = {
  idProduto: number;
  precoUnitario: number;
  quantidade: number;
};

export type Telefone = {
  ddd: number;
  telefone: number;
};

export type EnderecoCliente = {
  cep: string;
  descricaoLogradouro: string;
  numeroLogradouro: string;
  descricaoComplemento?: string | null;
  nomeBairro: string;
  nomeLocalidade: string;
  siglaUF: string;
};

export type CadastroCliente = {
  nome: string;
  cpfCnpj: string;
  inscricaoEstadual?: string | null;
  email?: string | null;
  nomeContato?: string | null;
  pessoaFisicaJuridica: "F" | "J";
  contribuinteIcms: 1 | 2;
  sexoCliente?: "M" | "F" | null;
  telefones: Telefone[];
  endereco: EnderecoCliente;
};

export type PreVendaRequest = {
  numeroPedidoCliente: string;
  observacao?: string | null;
  cliente: CadastroCliente;
  itens: PreVendaItem[];
};

export type RespostaPedidoVenda = {
  id: number;
  numero: number;
  itens: Array<{ id: number; quantidade: number; precoUnitario: number }> | null;
};

export class ExatoError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown
  ) {
    super(message);
    this.name = "ExatoError";
  }
}
