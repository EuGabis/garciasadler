# Garcia Sadler CRM - Documentação Técnica Completa

> Versão: HEAD `cc74ea8` - 2026-07-28
> Deploy: https://sistema.garciasadler.com.br
> Repo: https://github.com/EuGabis/garciasadler (público)

## Sumário

1. [Visão geral](#1-visão-geral)
2. [Stack tecnológico](#2-stack-tecnológico)
3. [Rotas](#3-rotas)
4. [Data model](#4-data-model)
5. [Integrações externas](#5-integrações-externas)
6. [Sistema de IA](#6-sistema-de-ia)
7. [Segurança](#7-segurança)
8. [Deploy e infraestrutura](#8-deploy-e-infraestrutura)
9. [Migrations aplicadas](#9-migrations-aplicadas)
10. [Variáveis de ambiente](#10-variáveis-de-ambiente)
11. [Comandos npm](#11-comandos-npm)
12. [Fluxos de negócio](#12-fluxos-de-negócio)
13. [Estado atual e roadmap](#13-estado-atual-e-roadmap)
14. [Debugging e observabilidade](#14-debugging-e-observabilidade)

---

## 1. Visão geral

CRM SaaS multi-tenant de atendimento WhatsApp para a loja **Garcia Sadler** (materiais de construção em São Roque/SP). Centraliza mensagens da loja em um painel único onde múltiplos atendentes respondem, com IA opcional que:

- Consulta produtos no ERP Exato em tempo real
- Calcula materiais de obra com fórmulas práticas
- Transcreve áudios do cliente (Whisper)
- Aplica glossário técnico do lojista pra traduzir jargão

**Escala do código:** 140 arquivos TypeScript/TSX, 17.149 linhas.

**Rotas:** 14 páginas dashboard + 5 APIs + 4 públicas.

---

## 2. Stack tecnológico

| Camada | Tech |
|---|---|
| Frontend | Next.js 16.2.6 (App Router, Server Components), React 19.2.4, TypeScript 5, Tailwind v4 |
| Fontes | Inter (Google Fonts via `next/font`) |
| Auth | NextAuth v5-beta (JWT, Credentials, PrismaAdapter, timing-safe bcrypt) |
| DB | Postgres via Railway + Prisma 7 + adapter-pg |
| Realtime | Pusher (private channels com auth) |
| IA | OpenAI SDK ^6.37 (gpt-4o-mini / gpt-4o / gpt-4.1-mini / gpt-4.1) + Whisper |
| WhatsApp | Evolution API v2.x (`messykrill-evolution.cloudfy.live`) |
| ERP | API Exato (PML Sistemas) |
| Validação | Zod ^4 |
| Crypto | bcryptjs (senhas) + AES-256-GCM (secrets) + jose (JWT) |
| Hosting | Vercel (framework nextjs, região iad1, Turbopack) |
| Datas | date-fns + `Intl.DateTimeFormat` (timezone `America/Sao_Paulo`) |

**Build**: `prisma generate && prisma migrate deploy && next build` - migrations aplicadas automaticamente em cada deploy.

---

## 3. Rotas

### Públicas (sem auth)

```
/                    -> 307 redireciona pra /login ou /dashboard
/login               -> tela de login (email + senha)
/register            -> 404 por padrão (só abre se ENABLE_PUBLIC_REGISTRATION=true)
/manual              -> guia público do sistema (Stripe Docs style, 13 seções)
```

### Dashboard (autenticadas, dentro de `(dashboard)/`)

```
/dashboard                    - visão geral + KPIs
/conversations                - inbox WhatsApp
/conversations/[id]           - chat individual (3 painéis)
/contatos                     - lista de contatos
/contatos/new                 - cadastrar contato
/contatos/[id]                - detalhe do contato
/pipeline                     - Kanban de vendas
/etiquetas                    - CRUD de etiquetas coloridas
/analytics                    - métricas + heatmap
/automacoes                   - regras (first_message, keyword)
/automacoes/followups         - follow-ups automáticos
/respostas-rapidas            - textos prontos
/equipe                       - CRUD de agentes + reset senha
/configuracoes                - 9 tabs (workspace/webhook/exato/automacoes/respostas/equipe/conta/ia/logs)
```

### API

```
/api/auth/[...nextauth]       - NextAuth handlers
/api/webhook                  - Evolution (POST fail-closed via header apikey)
/api/cron/followups           - Vercel Cron 1x/dia (Bearer CRON_SECRET)
/api/messages/[id]/media      - serve mídia on-demand com auth + workspace check
/api/pusher/auth              - autoriza private channels do Pusher
```

---

## 4. Data model

### Multi-tenancy (raiz)

```
Workspace -+- Users (+Account/Session NextAuth, +UserInvite, +PasswordReset)
           +- Contacts --- Conversations --+- Messages
           |                                +- ConversationLabel - Label
           |                                +- ConversationAssignment
           |                                +- KanbanCard - KanbanColumn
           +- QuickReply / Setting
           +- AgentConfig                   <- IA (criptografada)
           +- Automation                    <- keyword/first_message
           +- FollowUp + FollowUpLog        <- cron diário
           +- AuditLog / ErrorLog
           +- IntegracaoExato               <- credencial ERP (AES-256-GCM)
```

### Enums

| Enum | Valores |
|---|---|
| `UserRole` | `owner`, `admin`, `agent` |
| `ContactStatus` | `active`, `archived`, `blocked` |
| `ConversationStatus` | `open`, `pending`, `resolved`, `archived` |
| `ConversationChannel` | `whatsapp`, `web`, `instagram` |
| `MessageRole` | `user`, `assistant`, `tool`, `system` |
| `MessageType` | `text`, `image`, `audio`, `video`, `document`, `location` |
| `MessageDirection` | `inbound`, `outbound` |
| `MessageStatus` | `pending`, `sent`, `delivered`, `read`, `failed` |
| `AutomationTriggerType` | `keyword`, `first_message`, `no_reply` |
| `FollowUpTriggerType` | `inactivity`, `column_entry` |

### Campos-chave por model

**Workspace**: `id, name, slug (unique), plan, active, evolutionUrl, evolutionKey, evolutionInstance (unique)`

**User**: `id, workspaceId, name, email (unique), password (bcrypt), role, avatar, color, isOnline, lastLoginAt, passwordChangedAt`

**Contact**: `id, workspaceId, name, phone, email, avatar, notes, productInterest, source, status, [workspaceId,phone] unique`

**Conversation**: `id, workspaceId, contactId, status, channel, unreadCount, lastMessage, lastMessageAt, aiEnabled (default true)`

**Message**: `id, conversationId, senderId?, role, direction, type, status, content, mediaUrl?, mediaBase64?, fileName?, transcript?, evolutionId (unique), toolCalls (json), toolCallId`

**AgentConfig** (1x1 com Workspace):
```
enabled, systemPrompt?, stopCommand (/parar), model (gpt-4o-mini),
apiKey (encrypted), searchGlossary?, scheduleStartHour?, scheduleEndHour?,
tokensUsedTotal, tokensUsedMonth, tokensResetAt
```

**IntegracaoExato** (1x1 com Workspace):
```
usuario, senhaEncrypted (AES-256-GCM), lojaId?, lojaNome?,
lojaCodigoAcesso?, tokenAtual?, refreshToken?, tokenExpiraEm?,
ultimoLoginEm?, ultimoErro?
```

**ErrorLog**: `workspaceId, level, scope, message, errorName?, stack?, context (json), requestId?, userId?, url?, ip?, acknowledged`

**AuditLog**: `workspaceId, userId?, action, target?, meta (json), ip?, userAgent?`

**RateLimit**: `key (unique), attempts, resetAt`

---

## 5. Integrações externas

### Evolution API (WhatsApp)

- **URL**: `messykrill-evolution.cloudfy.live`
- **Instância**: `Garcia Sadler`
- **Conta**: `5511992970978` (Depósito Garcia Sadler)
- **Baileys** integration
- **Webhook config**: URL aponta pra `sistema.garciasadler.com.br/api/webhook`, `webhookByEvents: false` (crítico), header `apikey` batendo com `WEBHOOK_SECRET`
- **Eventos escutados**: `MESSAGES_UPSERT`, `MESSAGES_UPDATE`, `CONNECTION_UPDATE`, `SEND_MESSAGE`
- **Autenticação**: header `apikey: <valor>` OU `x-webhook-secret: <valor>`

### API Exato (PML Sistemas)

Endpoints usados (base: `apiexatointegracao.pmlsistemas.com.br`):

| Endpoint | Uso |
|---|---|
| `POST /autenticacao/login` | Login inicial (usuario+senha) |
| `POST /autenticacao/refresh` | Renovar token sem re-login |
| `GET /lojas` | Descobrir `codigoAcesso` por loja |
| `GET /produtos` | Buscar produtos (paginado, filtros: código, descrição, marca, aplicação) |
| `POST /PedidoVenda` | Criar pedido (ainda não integrado - Sprint 1 Fase D) |

Fluxo: `ensureToken()` mantém token em cache no DB, refresh automático quando expira, fallback pra login full se refresh falhar.

### OpenAI

- SDK ^6.37
- **Chat**: modelo configurável (`gpt-4o-mini` default, `gpt-4o`, `gpt-4.1-mini`, `gpt-4.1`)
- **Whisper**: transcrição de áudios recebidos do WhatsApp (populado via `after()` no webhook)
- Chave criptografada em `AgentConfig.apiKey` (AES-256-GCM)

### Pusher

- Private channels: `private-workspace-{workspaceId}`
- Autenticação via `/api/pusher/auth` (valida session + workspace ownership)
- Uso: notificação em tempo real de nova mensagem no chat

---

## 6. Sistema de IA

### System prompt

Versão **v6** em `src/lib/agent-config.ts` como `DEFAULT_SYSTEM_PROMPT`. Estrutura:

```
1. Identidade
2. Regra de formatação (cabeçalho "Atendimento Garcia Sadler:")
3. Princípios invioláveis
3.1 Regras de busca de produto (busca tolerante obrigatória)
4. Menu inicial
4.1 Reconhecimento de perguntas implícitas
4.2 Atendimento por áudio, foto, documento
5. Fluxo cotação (5.0 a 5.11 + 5.A cálculo obra)
6. Fluxo cliente existente
7. Fluxo dúvidas (FAQ)
8. Horário comercial (7h-18h seg-sex, 7h-13h sáb)
9. Mensagem padrão de transferência humano
```

Custom por workspace: `AgentConfig.systemPrompt` (limite 50k chars). Se vazio, usa default.

### Glossário técnico

`AgentConfig.searchGlossary` - free-text injetado no prompt antes de cada chamada. Uso: mapear jargão do lojista pro cadastro real:

```
bloco 15 = BLOCO CONCRETO 14x19x39
3 quartos = 3/4
areia media = AREIA MEDIA LAVADA
```

### Janela horária

`AgentConfig.scheduleStartHour` e `scheduleEndHour` (0-23, `America/Sao_Paulo`):
- Ambos `null` -> IA sempre ativa 24h
- Setados -> IA responde só dentro da janela `[start, end)`
- Suporta janela que atravessa meia-noite (ex: `19` a `7` = das 19h às 06h59)

### Tools disponíveis

**`buscar_produto(termo)`**
- Consulta catálogo Exato via `buscarProdutos()` em `src/lib/exato/produtos.ts`
- Busca tolerante: normaliza acentos, remove stopwords, tokeniza, filtra local
- Substituições semânticas: `3 quartos -> 3/4`, `bloco 15 -> bloco 14`, etc
- Retorna nome, descrição, marca, preço, código (**sem estoque** - regra de negócio: nunca bloqueia venda)
- Handler de erro: retorna `{erro: "estoque_indisponivel", permanente: true}` pra evitar loop

**`calcular_obra(tipo, ...params)`**
- Tipos: `contrapiso`, `alvenaria`, `reboco`, `telhado`, `pintura`, `concreto`, `aco`
- Fórmulas práticas em `src/lib/calc-obra.ts` (traço 1:4, tijolo 9 furos 9x19x19, ~17 telhas/m2)

### Parâmetros do engine

| Constante | Valor | Justificativa |
|---|---|---|
| `MAX_HISTORY` | 60 mensagens | Cotação longa acumula muitas tool calls |
| `MAX_TOOL_ROUNDS` | 8 | Limite antes de forçar resposta textual (último round sem tools) |
| `MAX_TOKENS_PER_RESPONSE` | 600 | Cap por completion |
| Modelo default | `gpt-4o-mini` | Editável em `/configuracoes?tab=ia` |
| Comando de parada | `/atendente` | Cliente digita pra desligar IA na conversa |

### Sanitização de messages

Antes de cada chamada, `sanitizeMessages()` respeita invariantes da OpenAI Chat API:
1. Toda `tool` message precisa vir depois de `assistant(tool_calls)` com matching `id`
2. Todo `assistant(tool_calls)` precisa ter `tool` responses pra todos os ids em seguida

Dropa sequências órfãs (comum quando MAX_HISTORY corta no meio).

### Triggers (quando a IA é chamada)

1. **Mensagem inbound no webhook** -> `after()` do Next 16 dispara `invokeAiResponse` em background
2. **Toggle IA OFF->ON pela UI** -> responde a última msg pendente do cliente

### Gates (em ordem, todos precisam passar)

1. `AgentConfig.enabled = true`
2. `AgentConfig.apiKey` configurada
3. `Conversation.aiEnabled = true`
4. Cliente não enviou `stopCommand`
5. Última msg é do cliente
6. Dentro da janela horária (se configurada)

### Fluxo end-to-end

```
Cliente WhatsApp -> POST /api/webhook (header apikey)
  +- rate limit + payload size (6MB)
  +- extract() -> {type, content, mediaBase64}
  +- upsert Contact + Conversation
  +- insere Message inbound
  +- after() -> invokeAiResponse (background)
        +- withDbRetry(generateReply)
        |    +- getAgentConfig() (decripta apiKey)
        |    +- resolveSystemPrompt() + inject glossary
        |    +- carrega últimas 60 msgs + sanitizeMessages()
        |    +- loop até 8 rounds (Chat Completions)
        |    |    +- tool_calls -> executa -> persiste -> próximo round
        |    |    +- text final -> encerra
        |    +- retorna {reply, rounds, tokens}
        +- sendWhatsAppText via Evolution
        +- persiste Message outbound
        +- update Conversation.lastMessage
        +- publishRealtime (Pusher, best-effort)
        +- incrementTokenUsage
```

---

## 7. Segurança

### Autenticação

- **NextAuth v5** com Credentials provider
- **JWT strategy** (não Session DB) - passwordChangedAt carregado no token
- **bcryptjs** rounds 12
- **Timing-safe** - sempre roda bcrypt.compare mesmo com user inexistente (dummy hash)
- **Enum-safe email**: register retorna "não foi possível concluir" em vez de "email já existe"
- **Min 8 chars** senha (register + auth)

### RBAC (3 níveis)

| Role | Pode |
|---|---|
| `owner` | Tudo: criar/deletar/promover outros owners, mexer em qualquer config, resetar senha de owner |
| `admin` | Gerencia equipe (menos owners), edita workspace, configura automações |
| `agent` | Atende conversas, mexe em contatos/pipeline, sem acesso a configs |

Verificado em toda server action via `canManageTeam(session.user.role)`.

### Fail-closed nos endpoints críticos

| Endpoint | Sem env | Sem auth |
|---|---|---|
| `POST /api/webhook` | 503 | 401 |
| `/api/cron/followups` | 503 | 401 |
| `/register` | 404 (default) | - |

### Encryption at rest

| Dado | Método |
|---|---|
| Senha usuário | bcrypt rounds 12 |
| OpenAI API key | AES-256-GCM (env `INTEGRATION_ENCRYPTION_KEY`) |
| Evolution API key | AES-256-GCM |
| Exato senha | AES-256-GCM |
| PII em logs | Redaction automático (`password`, `secret`, `key`, `token`, `authorization`, `apikey`) |

Chave AES normalizada via SHA-256, IV aleatório 12 bytes por encrypt.

### Rate limiting

Model `RateLimit(key, attempts, resetAt)`. Aplicado em:
- `/login` - protege contra brute-force
- `/api/webhook` - protege contra flood

### CSP + cookies

- **CSP enforcing com nonce** (não `unsafe-inline`)
- Cookies `__Host-*`, `SameSite=Lax`, `Secure`, `HttpOnly`
- HSTS habilitado
- MIME sniff bloqueado (`X-Content-Type-Options`)

### Outras camadas

- **SSRF guard** - validação de URLs externas
- **Payload size limit** - webhook 6MB
- **Cross-workspace ID checks** - toda query valida `workspaceId` do session
- **Reset password**: invalida sessões antigas via `passwordChangedAt` no JWT
- **Audit log** em ações sensíveis: `user.create/delete/update_role/password_change/reset_password`, `workspace.update`, `session.login/logout`, `automation.*`, `followup.*`, `contact.delete`
- **ErrorLog** persistido no DB (level, scope, stack, contexto), visível em `/configuracoes?tab=logs`

---

## 8. Deploy e infraestrutura

### Vercel (hosting)

- Time: `gabriels-projects-fa9c86e6`
- Project: `garciasadler`
- Framework: Next.js
- Região: `iad1` (Washington DC)
- Bundler: Turbopack
- Domains: `sistema.garciasadler.com.br` (principal), `garciasadler.vercel.app` (fallback)
- Build: `prisma generate && prisma migrate deploy && next build`
- Postinstall: `prisma generate`

### Railway (Postgres)

- Postgres 16
- Volume: `postgres-volume`
- Connection: `DATABASE_URL` (Transaction Pooler, porta 6543) pra runtime, `DIRECT_URL` (Session Pooler, porta 5432) pra migrations
- **Sem backup automático no Free tier** - considerar Pro

### Evolution API Cloud

- Provedor: cloudfy.live (host de terceiros)
- URL: `messykrill-evolution.cloudfy.live`
- Client: `evolution_exchange` versão 2.3.7
- Integração: WHATSAPP-BAILEYS

### OpenAI (usage-based)

- Consumo tracked em `AgentConfig.tokensUsedMonth`/`tokensUsedTotal`
- Reset manual no botão da aba IA

---

## 9. Migrations aplicadas

```
20260514020505_init                                       - schema base
20260515200000_add_integracao_exato                       - model IntegracaoExato
20260517010000_unique_evolution_instance_and_password_changed_at
20260517020000_ai_enabled_default_true
20260517030000_error_log                                  - ErrorLog + índices
20260523020000_ai_enabled_default_false_and_reset
20260710000000_ai_schedule_and_default_on                 - janela horária + aiEnabled default true (de novo)
20260728050000_ai_search_glossary                         - AgentConfig.searchGlossary
20260728060000_message_transcript                         - Message.transcript
```

---

## 10. Variáveis de ambiente

### Obrigatórias

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | Postgres (Transaction Pooler, porta 6543) |
| `DIRECT_URL` | Postgres (Session Pooler, porta 5432) - só pra migrations |
| `AUTH_SECRET` | NextAuth (min 32 chars, gerar com `openssl rand -hex 32`) |
| `AUTH_URL` | URL pública do app |
| `WEBHOOK_SECRET` | Header `apikey` exigido em `/api/webhook` (deve bater com apikey da instância Evolution) |
| `CRON_SECRET` | `Authorization: Bearer` exigido em `/api/cron/followups` |
| `INTEGRATION_ENCRYPTION_KEY` | AES-256 pra criptografar credenciais (min 32 chars) |

### Opcionais

| Variável | Descrição |
|---|---|
| `EVOLUTION_API_URL/_KEY/_INSTANCE` | Cliente Evolution (fallback quando workspace não configura) |
| `OPENAI_API_KEY/OPENAI_MODEL` | Fallback global (workspace tem sua própria em `AgentConfig`) |
| `PRODUTOS_API_URL/_KEY` | Legado (modo mock quando ausente) |
| `PUSHER_APP_ID/PUSHER_SECRET/NEXT_PUBLIC_PUSHER_KEY/NEXT_PUBLIC_PUSHER_CLUSTER` | Realtime |
| `ENABLE_PUBLIC_REGISTRATION` | `"true"` reabre `/register`. Default: `false` (404) |
| `SEED_OWNER_EMAIL/NAME/PASSWORD/WORKSPACE_NAME` | Só pra `npm run db:seed` |

---

## 11. Comandos npm

```bash
npm run dev                      # dev server local
npm run build                    # prisma generate + migrate deploy + next build
npm run start                    # produção local
npm run lint                     # eslint

npm run db:migrate               # aplicar migrations (usa DATABASE_URL)
npm run db:seed                  # criar workspace + owner (lê SEED_*)
npm run db:check                 # listar workspaces/usuários
npm run db:import                # importar histórico do Evolution
npm run db:rotate-password       # trocar senha (ROTATE_EMAIL + ROTATE_NEW_PASSWORD)
npm run db:close-all             # arquivar todas conversas (exige CONFIRM=yes)
```

---

## 12. Fluxos de negócio

### Fluxo 1 - Cliente novo chega no WhatsApp

```
Cliente manda "Olá" no WhatsApp da loja
  -> Evolution captura, POST no webhook
  -> Sistema cria Contact + Conversation (aiEnabled=true default)
  -> after() dispara IA
  -> IA responde com menu (Cotar / Cliente já existe / Dúvidas)
  -> Cliente escolhe opção
  -> Fluxo específico (cotação/pedido/FAQ)
```

### Fluxo 2 - Cotação de produto genérico

```
Cliente: "cimento"
  -> IA reconhece termo genérico -> pergunta consultiva ("qual aplicação?")
Cliente: "assentamento"
  -> IA chama buscar_produto("cimento cola") (via glossário)
  -> API Exato retorna produtos -> IA lista numerados
Cliente: "quero 5 do item 2"
  -> IA adiciona ao carrinho, mostra subtotal
Cliente: "só isso"
  -> IA apresenta resumo com total
Cliente: "pode fechar"
  -> IA pede retirada/entrega
  -> coleta CPF, endereço
  -> (Fase D pendente): chamaria criar_pedido no Exato
  -> Atualmente: transfere pra humano finalizar
```

### Fluxo 3 - Atendente humano assume

```
Cliente no meio de conversa com IA
Atendente envia mensagem manual pelo painel
  -> Sistema detecta e desativa IA daquela conversa (aiEnabled=false)
  -> Conversa fica só com humano até fim
  -> Se atendente clicar no badge "IA OFF" -> volta pra ON e IA responde próxima
```

### Fluxo 4 - Follow-up automático (cron)

```
Cron diário 9h UTC dispara /api/cron/followups
  -> busca FollowUps ativos
  -> pra cada trigger (inactivity/column_entry):
      -> identifica candidatos
      -> checa maxTimes por FollowUpLog
      -> dispara mensagem via Evolution
      -> registra em FollowUpLog
```

### Fluxo 5 - Áudio do cliente

```
Cliente manda áudio no WhatsApp
  -> Webhook recebe mediaBase64 + mimetype audio
  -> Persiste Message type=audio
  -> after() chama Whisper -> popula Message.transcript
  -> UI mostra player + transcrição abaixo com ícone Mic
  -> IA lê transcript em vez de "[áudio]" no histórico
```

---

## 13. Estado atual e roadmap

### Últimos commits (mais recentes primeiro)

```
cc74ea8 fix(ui): transcricao de audio nao estica mais o balao do chat
7341e1f feat(ai): transcricao de audio via Whisper
7778fee feat(ai): glossario tecnico do lojista injetado no system prompt
3067ff9 fix(tz): forca America/Sao_Paulo em todos os formatters
6ffac34 feat(ai): janela horaria opcional + aiEnabled default true
2fb3f92 chore(estilo): remove travessoes e emojis
3effaaa feat(manual): página pública /manual
adf566a fix(ia): select de modelo controlled + sync
960ce3e fix(audit): adiciona user.reset_password
a637d8b feat(equipe): owner/admin pode resetar senha
```

### Pendências priorizadas

**Sprint 1 - Fase D (fecha loop de venda)**
- Schema: `Contact.cpfCnpj/inscricaoEstadual/pessoaFisicaJuridica/endereço` + model `PedidoDraft`
- ViaCEP integration
- `src/lib/exato/pedidos.ts` (POST /PedidoVenda)
- Tool `preparar_pedido` na IA
- Server action `confirmarEnviarPedidoAction`
- UI: card de pedido pendente na conversa

**Backlog operacional**
- Health check da Evolution no dashboard (evita "sumiu tudo")
- Cache local de produtos + sync incremental diário via cron
- Migrar `mediaBase64` pra Vercel Blob (DB inflando)
- Analytics de custo IA (tokens x preço OpenAI)
- Link de pagamento PIX gerado no chat
- Detecção de sentimento -> escala pra humano quando cliente irritado
- Push notifications mobile (PWA + Service Worker)

**Backlog técnico**
- Testes automatizados (webhook crítico)
- CI/CD (GitHub Actions com lint + typecheck + testes)
- Sentry pra logging externo (não perde se DB cair)
- Multi-canal (Instagram DM, Facebook Messenger, web chat)
- Fluxo `UserInvite` (schema pronto, UI faltando)

---

## 14. Debugging e observabilidade

### Logs estruturados

`src/lib/logger.ts` - JSON por linha em produção (Vercel/Logflare parseiam):

```json
{"ts":"2026-07-28T13:52:09Z","level":"info","scope":"webhook/ai","msg":"ai reply sent","workspaceId":"...","conversationId":"...","rounds":3,"promptTokens":1247,"completionTokens":89}
```

Níveis: `debug`, `info`, `warn`, `error`, `fatal`. Errors e fatals **persistem em `ErrorLog`** automaticamente (fire-and-forget), com redaction de chaves sensíveis.

### ErrorLog em UI

`/configuracoes?tab=logs` - filtros por level, scope, ack/unack. Cada entrada expansível mostra:
- Timestamp
- Scope (ex: `webhook`, `ai/openai`, `exato/produtos`)
- Message
- Stack (truncado 5KB)
- Context (workspaceId, requestId, url, ip)

Retention: 30 dias (cleanup automático).

### Audit log

`/configuracoes?tab=logs` também mostra `AuditLog`. Actions rastreadas:
- `user.create/delete/update_role/password_change/reset_password`
- `workspace.update/evolution_key_change`
- `automation.create/update/delete`
- `followup.create/update/delete`
- `contact.delete`
- `session.login/logout`

### Como investigar mensagem que não chegou

```bash
# 1. Confirmar Evolution está enviando
curl "https://messykrill-evolution.cloudfy.live/webhook/find/Garcia%20Sadler" \
  -H "apikey: <EVO_API_KEY>"

# Verificar:
# - enabled: true
# - webhookByEvents: false (crítico)
# - headers.apikey igual ao WEBHOOK_SECRET
# - MESSAGES_UPSERT na lista de events

# 2. Testar endpoint direto
curl -X POST "https://sistema.garciasadler.com.br/api/webhook" \
  -H "apikey: <WEBHOOK_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"event":"messages.upsert","instance":"Garcia Sadler","data":{...}}'

# 3. Ver ErrorLog em /configuracoes?tab=logs com scope=webhook
```

### Como debugar IA

- **Não responde** -> checar `AgentConfig.enabled`, `Conversation.aiEnabled`, `stopCommand`, janela horária
- **Vício de histórico** -> arquivar conversa ou deletar contato pra zerar
- **`buscar_produto` falha** -> `/configuracoes?tab=exato` -> "Testar conexão" -> "Buscar produto (teste)"
- **Modelo errado** -> aba IA -> verificar seletor
- **Consumo alto de tokens** -> aba IA -> contador mensal

---

## Anexos rápidos

### URLs importantes

- Sistema: `https://sistema.garciasadler.com.br`
- Manual: `https://sistema.garciasadler.com.br/manual`
- Repo: `https://github.com/EuGabis/garciasadler`
- Vercel: `https://vercel.com/gabriels-projects-fa9c86e6/garciasadler`
- Evolution: `https://messykrill-evolution.cloudfy.live`
- Exato docs: `https://apiexatointegracao.pmlsistemas.com.br/documentacao`

### Endereço da loja

R. Leôncio de Toledo, 410, Mailasque, São Roque/SP, CEP 18143-600

### CNPJ / PIX

01.562.036.0001-21 (Garcia Sadler)
