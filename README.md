# Garcia Sadler CRM

CRM de atendimento WhatsApp para loja de materiais de construção.
Stack: Next.js 16 + TypeScript + Prisma 7 (Postgres) + NextAuth v5 + Evolution API + Pusher.

## Setup

```bash
npm install
cp .env.example .env.local      # preencher valores
npx prisma migrate deploy
npm run db:seed                 # cria workspace + owner (lê de SEED_*)
npm run dev
```

## Variáveis obrigatórias

| Variável         | O que é                                                                     |
|------------------|-----------------------------------------------------------------------------|
| `DATABASE_URL`   | URL do Postgres                                                             |
| `AUTH_SECRET`    | Secret do NextAuth (min 32 chars - gere com `openssl rand -hex 32`)         |
| `WEBHOOK_SECRET` | Header `x-webhook-secret` exigido em `POST /api/webhook` (fail-closed)      |
| `CRON_SECRET`    | `Authorization: Bearer ...` exigido em `/api/cron/followups` (fail-closed)  |
| `INTEGRATION_ENCRYPTION_KEY` | Chave de criptografia AES-256 pra credenciais de integrações (Exato etc). Min 32 chars. |

> **Importante**: sem `WEBHOOK_SECRET` e `CRON_SECRET` setados, os respectivos endpoints retornam 503. Isso é proposital - fail-closed.

## Variáveis opcionais

| Variável                       | O que é                                                          |
|--------------------------------|------------------------------------------------------------------|
| `EVOLUTION_API_URL`/`_KEY`/`_INSTANCE` | Cliente Evolution (também pode ser por workspace no DB)   |
| `OPENAI_API_KEY`               | Liga IA (tool use)                                               |
| `OPENAI_MODEL`                 | Default `gpt-4o-mini`                                            |
| `PRODUTOS_API_URL`/`_KEY`      | API real de produtos. Sem isso, modo mock.                       |
| `PUSHER_APP_ID`/`SECRET`/`KEY` | Realtime (servidor + client)                                     |
| `ENABLE_PUBLIC_REGISTRATION`   | `true` reabre `/register`. Default `false` (404).                |

## Integração Exato (PML Sistemas)

A IA pode consultar produtos e gerar pedidos no ERP Exato via API. Configuração:

1. `/configuracoes` → aba **Integração Exato**
2. Preencher usuário + senha (testados antes de salvar; senha criptografada com `INTEGRATION_ENCRYPTION_KEY`)
3. Clicar **Sincronizar lojas** → escolher a loja padrão
4. Clicar **Buscar produto (teste)** pra validar end-to-end

Endpoints integrados:
- `POST /autenticacao/login` + `POST /autenticacao/refresh` - token cache automático no DB
- `GET /lojas` - descoberta de `codigoAcesso` por loja
- `GET /produtos` - busca paginada com filtros (código, descrição, marca, aplicação)
- `POST /PedidoVenda` - preparado, mas **sempre exige confirmação humana** antes de enviar (Fase D)

## Procedimentos de segurança

### Rotacionar senha de um usuário

```bash
ROTATE_EMAIL=owner@example.com ROTATE_NEW_PASSWORD='nova-senha-forte' \
  npm run db:rotate-password
```

Senha nunca aparece em log nem é commitada. Lê só de env.

### Trocar a própria senha pela UI

Logue, vá em `/configuracoes` → aba **Conta** → trocar senha.

### Configurar o webhook Evolution

No painel da Evolution:
- **URL**: `https://seu-dominio/api/webhook`
- **Eventos**: `messages.upsert`, `messages.update`
- **Header customizado**: `x-webhook-secret: <valor de WEBHOOK_SECRET>`

Sem esse header com o valor exato, o webhook retorna 401.

### Cron do Vercel

`vercel.json` agenda `POST /api/cron/followups` 1×/dia (9h UTC, limite do plano Hobby). O Vercel envia `Authorization: Bearer ${CRON_SECRET}` automaticamente - só precisa setar a env var.

### Registro público

Por padrão fica fechado (`/register` → 404). Pra criar um workspace adicional:

1. Setar `ENABLE_PUBLIC_REGISTRATION=true` no Vercel
2. Acessar `/register`, criar
3. Voltar `ENABLE_PUBLIC_REGISTRATION=false`

## Estrutura

```
src/
├── app/
│   ├── (dashboard)/             ← rotas autenticadas
│   ├── api/
│   │   ├── webhook/route.ts     ← recebe Evolution (precisa WEBHOOK_SECRET)
│   │   └── cron/followups/      ← Vercel Cron (precisa CRON_SECRET)
│   ├── login/, register/, page.tsx
│   └── layout.tsx
├── lib/
│   ├── db.ts, env.ts, auth/
│   ├── openai.ts, evolution.ts, produtos.ts
│   ├── automations.ts, followups.ts, analytics.ts
│   └── kanban.ts, conversations.ts, contacts.ts, team.ts
├── auth.ts, auth.config.ts, proxy.ts (middleware)
└── generated/prisma/            ← gerado (gitignored)
prisma/
├── schema.prisma                ← 18 modelos multi-tenant
└── migrations/
scripts/
├── seed.ts                      ← cria workspace + owner (env-driven)
├── rotate-password.ts           ← rotaciona senha de usuário (env-driven)
├── check-state.ts               ← lista workspaces/usuários
├── import-history.ts            ← importa histórico do Evolution
└── close-all.ts                 ← arquiva todas conversas (precisa CONFIRM=yes)
```
