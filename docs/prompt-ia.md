# Prompt da IA - Garcia Sadler CRM

> Documentação do agente IA que atende clientes no WhatsApp.
> Fonte: [`src/lib/agent-config.ts`](../src/lib/agent-config.ts), [`src/lib/openai.ts`](../src/lib/openai.ts), [`src/lib/ai-respond.ts`](../src/lib/ai-respond.ts).

---

## Sumário

- [1. System prompt](#1-system-prompt)
- [2. Tools disponíveis](#2-tools-disponíveis)
- [3. Parâmetros do engine](#3-parâmetros-do-engine)
- [4. Quando a IA é chamada (triggers + gates)](#4-quando-a-ia-é-chamada-triggers--gates)
- [5. Fluxo end-to-end](#5-fluxo-end-to-end)
- [6. Observabilidade](#6-observabilidade)
- [7. Comportamentos especiais](#7-comportamentos-especiais)
- [8. Notas e pontos de atenção](#8-notas-e-pontos-de-atenção)

---

## 1. System prompt

### Default

Constante `DEFAULT_SYSTEM_PROMPT` em [`src/lib/agent-config.ts`](../src/lib/agent-config.ts). Usado quando o workspace não tem prompt customizado.

```
Você é o atendente virtual da Garcia Sadler, loja de materiais de construção.

REGRAS:
1. Atenda em português brasileiro, de forma cordial e objetiva. Use
   tratamento informal mas profissional.
2. Pra preço, estoque, ou características de produto, SEMPRE use a
   ferramenta buscar_produto antes de responder. NUNCA invente valores
   ou disponibilidade.
3. Pra perguntas de quantidade de material pra obra ("quanto preciso
   de cimento pra 30m² de contrapiso?"), use a ferramenta calcular_obra.
4. Se o cliente pedir lista de produtos, sugira buscar por categoria.
5. Não prometa prazo de entrega, frete ou condições de pagamento - isso
   depende de cada caso e tem que ser combinado com atendente humano.
6. Se a pergunta é complexa, fora de produtos, ou se o cliente parece
   irritado, diga que um atendente humano vai assumir.
7. Mensagens curtas. Sem floreios. Quando listar produtos, mostre nome,
   preço e estoque.
```

### Custom por workspace

Cada workspace pode sobrescrever em `AgentConfig.systemPrompt` (editável em `/configuracoes?tab=ia`). Limite atualizado pra **50.000 chars** (commit `9f07e3e`).

Resolução:

```ts
// agent-config.ts
export function resolveSystemPrompt(config: AgentConfigData): string {
  return (config.systemPrompt && config.systemPrompt.trim().length > 0)
    ? config.systemPrompt
    : DEFAULT_SYSTEM_PROMPT;
}
```

---

## 2. Tools disponíveis

Definidas em `TOOLS` em [`src/lib/openai.ts`](../src/lib/openai.ts).

###  `buscar_produto`

Consulta produtos no estoque via API Exato (PML Sistemas).

| Campo | Valor |
|---|---|
| **Backend** | [`src/lib/exato/produtos.ts`](../src/lib/exato/produtos.ts) → `buscarProdutos()` |
| **Endpoint** | `GET /produtos` da API Exato |
| **Cache** | Nenhum (chamada direta a cada uso) |
| **Heurística de busca** | ≤6 chars + sem espaço + com dígito → busca por `codigoProduto`; senão, `descricaoProduto`. Fallback de código pra descrição se vier vazio. |

**Schema do parâmetro:**

```json
{
  "type": "object",
  "properties": {
    "termo": {
      "type": "string",
      "description": "Código (até 6 chars, ex: CIM50) ou descrição (ex: cimento, areia, tijolo). Use termo curto e específico."
    }
  },
  "required": ["termo"]
}
```

**Retorno (sucesso):**

```json
{
  "encontrados": 3,
  "produtos": [
    { "codigo": "CIM50", "descricao": "...", "marca": "...", "grupo": "...", "preco": 38.90 }
  ]
}
```

**Retorno (vazio):**

```json
{ "encontrados": 0, "mensagem": "Nenhum produto com 'X'" }
```

**Retorno (erro):**

```json
{
  "erro": "estoque_indisponivel",
  "permanente": true,
  "mensagem": "A integração com o estoque está temporariamente indisponível. Não tente buscar produtos novamente nesta conversa. Responda ao cliente normalmente sem dados de estoque, ou ofereça transferir para um vendedor humano."
}
```

> A flag `permanente: true` é **deliberada** - evita que o modelo entre em loop de tool calls quando a API Exato cai.

>  **Regra de negócio embutida**: o campo `estoque` é **deliberadamente removido** do retorno pro modelo ([`openai.ts:119-122`](../src/lib/openai.ts)). Justificativa no código: *"estoque nunca bloqueia venda, para o cliente todo produto está disponível"*. O saldo será checado no servidor quando o fluxo de criar pedido existir (Sprint 1 Fase D).

###  `calcular_obra`

Calcula materiais necessários por tipo de obra usando fórmulas práticas.

| Campo | Valor |
|---|---|
| **Backend** | [`src/lib/calc-obra.ts`](../src/lib/calc-obra.ts) |
| **Tipos suportados** | `contrapiso`, `alvenaria`, `reboco`, `telhado`, `pintura`, `concreto`, `aco` |

**Schema do parâmetro:**

```json
{
  "type": "object",
  "properties": {
    "tipo": {
      "type": "string",
      "enum": ["contrapiso", "alvenaria", "reboco", "telhado", "pintura", "concreto", "aco"]
    },
    "areaM2":       { "type": "number", "description": "Área em m². Pra contrapiso/reboco/telhado/pintura." },
    "comprimentoM": { "type": "number", "description": "Comprimento em metros. Pra alvenaria." },
    "alturaM":      { "type": "number", "description": "Altura em metros. Pra alvenaria." },
    "espessuraCm":  { "type": "number", "description": "Espessura em cm. Default 5 (contrapiso) ou 2 (reboco)." },
    "volumeM3":     { "type": "number", "description": "Volume em m³. Pra concreto." },
    "quantidadeM":  { "type": "number", "description": "Comprimento total em metros. Pra aço." },
    "tipoTelha":    { "type": "string", "enum": ["ceramica", "fibrocimento"] },
    "elemento":     { "type": "string", "enum": ["viga", "pilar", "laje"] },
    "lados":        { "type": "number", "description": "1 ou 2 lados de reboco. Default 1." },
    "demaos":       { "type": "number", "description": "Demãos de pintura. Default 2." },
    "bitolaMm":     { "type": "number", "description": "Bitola do aço em mm. Default 8." }
  },
  "required": ["tipo"]
}
```

**Assinaturas das funções por tipo:**

| Tipo | Assinatura |
|---|---|
| `contrapiso` | `(areaM2, espessuraCm?)` |
| `alvenaria` | `(comprimentoM, alturaM)` |
| `reboco` | `(areaM2, espessuraCm?, lados?)` |
| `telhado` | `(areaM2, tipoTelha)` |
| `pintura` | `(areaM2, demaos?)` |
| `concreto` | `(volumeM3)` |
| `aco` | `(elemento, quantidadeM, bitolaMm?)` |

**Fórmulas de referência** (documentadas em `calc-obra.ts`):
- Contrapiso: traço 1:4 cimento:areia, espessura padrão 5cm
- Alvenaria: tijolo 9 furos 9×19×19 + argamassa 1:2:6
- Reboco: 2cm com argamassa 1:2:8
- Telhado cerâmico: ~17 telhas/m²

---

## 3. Parâmetros do engine

Constantes em [`src/lib/openai.ts`](../src/lib/openai.ts).

| Constante | Valor | Justificativa |
|---|---|---|
| `MAX_HISTORY` | **60 mensagens** | Cotação real acumula muita msg (tool calls inflam histórico). Com 20, IA perdia itens originais do carrinho |
| `MAX_TOOL_ROUNDS` | **8** | Limite de tool calls antes de forçar resposta textual |
| `MAX_TOKENS_PER_RESPONSE` | **600** | Cap por completion |
| `FALLBACK_REPLY` | `"Estou consultando algumas informações pra te ajudar. Um atendente vai dar continuidade em instantes."` | Garante que cliente sempre recebe alguma resposta - nunca silêncio |
| Modelo default | `gpt-4o-mini` | Editável em `AgentConfig.model` |
| Comando de parada | `/atendente` | `AgentConfig.stopCommand` - cliente digita pra desligar IA na conversa |

---

## 4. Quando a IA é chamada (triggers + gates)

### Triggers

A IA dispara em **2 situações** (via `invokeAiResponse` em [`src/lib/ai-respond.ts`](../src/lib/ai-respond.ts)):

1. **Mensagem nova no webhook**
   `POST /api/webhook` → mensagem inbound chega → roda em background via `after()` do Next 16 → resposta enviada pelo WhatsApp via Evolution

2. **Toggle IA OFF→ON pela UI**
   Quando você liga o badge "IA" na conversa, o sistema dispara a IA pra responder à última msg pendente do cliente (commit `472481a`).

### Gates (em ordem)

A IA só responde se **todos** passarem:

1. `AgentConfig.enabled = true` *(habilitada pela aba IA)*
2. `AgentConfig.apiKey` configurada *(OpenAI key)*
3. `Conversation.aiEnabled = true` *(badge ligado na conversa)*
4. Cliente não enviou o `stopCommand` (`/atendente`)
5. Última msg é do cliente (não da própria IA)
6. Conversa não tem agente humano enviando ativamente *(auto-disable)*

Se qualquer um falhar, `generateReply` retorna `{ ok: false, reason: ... }` e nada é enviado pro WhatsApp.

---

## 5. Fluxo end-to-end

```
Cliente WhatsApp envia msg
    │
    ▼
Evolution → POST /api/webhook (header apikey)
    │
    ├─ valida secret (fail-closed)
    ├─ rate limit por IP
    ├─ payload size limit (6MB)
    ├─ extract() → {type, content, mediaBase64}
    ├─ upsert Contact + Conversation
    ├─ insere Message inbound
    └─ after() → invokeAiResponse() (background, não bloqueia ack)
                    │
                    ▼
            withDbRetry(generateReply)   ← retry se Postgres cair
                    │
                    ├─ getAgentConfig()  ← decripta apiKey (AES-256-GCM)
                    ├─ resolveSystemPrompt()  ← default ou custom
                    ├─ carrega últimas 60 msgs (com tool_calls)
                    │
                    ├─ loop até 8 rounds:
                    │     openai.chat.completions.create()
                    │       │
                    │       ├─ se tool_calls → executa (buscar_produto / calcular_obra),
                    │       │                  persiste tool result, próximo round
                    │       └─ se text final → encerra loop
                    │
                    └─ retorna { ok, reply, rounds, tokensUsage }

            sendWhatsAppText() via Evolution
            persiste Message outbound (texto puro)
            update Conversation.lastMessage / lastMessageAt
            publishRealtime() (Pusher, best-effort)
            incrementTokenUsage()  ← AgentConfig.tokensUsedMonth/Total
```

---

## 6. Observabilidade

Cada resposta gera:

- **Tokens consumidos** - `AgentConfig.tokensUsedMonth` e `AgentConfig.tokensUsedTotal` incrementados (mesmo em fallback)
- **Logger estruturado** - scope `webhook/ai` com `workspaceId`, `conversationId`, `rounds`, `promptTokens`, `completionTokens`
- **Tab Logs** - visíveis em `/configuracoes?tab=logs` filtrando por scope `webhook/ai`
- **ErrorLog automático** - erros de `buscar_produto` ou OpenAI vão pra DB via `route-wrapper`
- **Audit log** - toggle ON/OFF da IA fica registrado

---

## 7. Comportamentos especiais

### Último round sem tools (anti-loop)

No último round (`round === MAX_TOOL_ROUNDS - 1`), o engine **remove o array de tools** da request:

```ts
const isLastRound = round === MAX_TOOL_ROUNDS - 1;
response = await client.chat.completions.create({
  model: cfg.model,
  max_tokens: MAX_TOKENS_PER_RESPONSE,
  messages,
  ...(isLastRound ? {} : { tools: TOOLS }),
});
```

Isso força o modelo a gerar texto puro em vez de continuar pedindo tool calls indefinidamente. Sem essa salvaguarda, alguns modelos preferem pedir mais buscas em loop.

### Retry de conexão Postgres

`withDbRetry` envolve as escritas críticas. Em serverless, a conexão Postgres pode cair de forma transitória; o retry com nova conexão resolve. Veja `src/lib/db.ts`.

### Fallback amigável

Se o engine estourar `MAX_TOOL_ROUNDS` sem gerar texto, envia o `FALLBACK_REPLY` em vez de silenciar o cliente. Tokens consumidos até ali são contabilizados normalmente.

### Realtime best-effort

`publishRealtime` (Pusher) **não derruba** a resposta se falhar - o WhatsApp já foi enviado, só a UI deixa de receber o ping em tempo real.

### Estoque omitido pro modelo

Documentado na seção de `buscar_produto` acima - regra de negócio explícita.

---

## 8. Notas e pontos de atenção

| Severidade | Item | Por quê |
|---|---|---|
|  Médio | Regra 7 do prompt diz "mostre nome, preço **e estoque**", mas o backend remove `estoque` do retorno do `buscar_produto` | Contradição - o modelo é instruído a mostrar algo que ele não tem nos dados. Vale alinhar o prompt: *"mostre nome e preço; disponibilidade você confirma na hora do pedido"*. |
|  Médio | Comentário do `openai.ts` diz "Modo: AUTOMÁTICO (envia direto via Evolution)" | Verdadeiro pra mensagens conversacionais. Quando a Fase D entrar, **criar pedido sempre exigirá confirmação humana** - só as respostas seguem automáticas. |
|  Baixo | Prompt não menciona regras de pedido (CPF/endereço, confirmar antes) | Esperado - essas regras entram quando `preparar_pedido` for adicionada na Sprint 1 (Fase D). |
|  Baixo | Não tem tool pra "lista de produtos por categoria" mas regra 4 sugere | Hoje a IA improvisa chamando `buscar_produto` com termo amplo (ex: "tinta") - funciona razoavelmente. |

---

## Próximas tools planejadas (Sprint 1 Fase D)

A serem adicionadas quando a Fase D for implementada (tasks #1-#6 no harness):

- `preparar_pedido(itens[])` - valida produtos via Exato, cria `PedidoDraft` no DB com status `aguardando_dados` ou `aguardando_confirmacao`. **Nunca envia direto** pro Exato - humano confirma na UI.
- `consultar_pedido_enviado(numeroOuId)` - retorna **apenas** `{numero, status, dataEnvio}` (sem itens nem preços) pra IA poder responder com segurança sobre pedidos já enviados.

Mais detalhes nas tasks abertas.
