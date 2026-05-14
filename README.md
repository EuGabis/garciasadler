# Garcia Bot

Atendimento via WhatsApp para loja de materiais de construção.
Stack: Next.js 16 + TypeScript + Prisma (Postgres) + OpenAI (tool use) + Evolution API.

## Fluxo

```
Cliente WhatsApp
     │ mensagem
     ▼
Evolution API ──► POST /api/webhook
                       │
                       ▼
              [salva conversation + message]
                       │
                       ▼
              generateReply (OpenAI)
                  │           ▲
                  │ tool_use  │ tool_result
                  ▼           │
              buscarProduto / listarPorCategoria
                  │
                  ▼ (mock ou API real)
              resposta final
                       │
                       ▼
              sendWhatsAppText (Evolution)
                       │
                       ▼
                  Cliente recebe
```

## Setup

```bash
npm install
cp .env.example .env   # preencher valores
npx prisma migrate dev --name init
npm run dev
```

## Variáveis obrigatórias

| Variável             | O que é                                                |
|----------------------|--------------------------------------------------------|
| `DATABASE_URL`       | String pública do Postgres (Railway)                   |
| `OPENAI_API_KEY`     | Chave OpenAI (sk-...)                                  |
| `OPENAI_MODEL`       | Modelo (default `gpt-4o-mini`)                         |
| `EVOLUTION_API_URL`  | URL do servidor Evolution                              |
| `EVOLUTION_API_KEY`  | API key global da sua Evolution                        |
| `EVOLUTION_INSTANCE` | Nome da instância (WhatsApp conectado)                 |

## Variáveis opcionais

| Variável             | O que é                                                |
|----------------------|--------------------------------------------------------|
| `PRODUTOS_API_URL`   | API externa de produtos. Sem isso, roda em modo mock.  |
| `PRODUTOS_API_KEY`   | Bearer token da API de produtos                        |
| `WEBHOOK_SECRET`     | Se setado, exige header `x-webhook-secret` no webhook  |

## Modo mock

Sem `PRODUTOS_API_URL`, o `src/lib/produtos.ts` usa um catálogo fictício
(8 produtos) pra você testar tool use antes de plugar a API real.

## Como plugar a API real

Edite `src/lib/produtos.ts`:
- Ajuste o tipo `Produto` pro formato que sua API retorna
- Ajuste as URLs em `buscarProduto` e `listarPorCategoria`
- Setar `PRODUTOS_API_URL` (e `PRODUTOS_API_KEY` se autenticada) no `.env`

## Webhook Evolution

No painel da sua instância Evolution, configure:
- **URL**: `https://seu-dominio/api/webhook`
- **Eventos**: `messages.upsert` (apenas)
- Se setou `WEBHOOK_SECRET`, adicione o header `x-webhook-secret`

## Estrutura

```
src/
├── app/
│   ├── api/webhook/route.ts   ← recebe do Evolution
│   ├── page.tsx               ← painel de status
│   └── layout.tsx
├── lib/
│   ├── db.ts                  ← Prisma singleton
│   ├── env.ts                 ← validação Zod
│   ├── openai.ts              ← tool use + histórico
│   ├── evolution.ts           ← cliente Evolution
│   └── produtos.ts            ← mock + API real
└── generated/prisma/          ← gerado pelo Prisma (gitignored)
prisma/
└── schema.prisma
```
