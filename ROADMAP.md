# Roadmap - Garcia Sadler CRM

## Status atual

-  **Fase 1 - Fundação**: schema multi-tenant (18 modelos), NextAuth v5, layout do dashboard
-  **Fase 2 - Conversas**: lista lateral + chat + envio via Evolution
-  **Fase 3 - Realtime**: código pronto (Pusher), aguarda env vars no Vercel

## Sprint 1 - Atendimento sólido

Foco: o atendimento básico funciona sem furos.

- Finalizar Pusher (env vars no Vercel + redeploy)
- Sincronizar mensagens `fromMe=true` - respostas pelo celular aparecem no painel
- Status das mensagens (sent/delivered/read via ACKs do Evolution)
- Notificação sonora + badge no favicon
- Validar realtime end-to-end

## Sprint 2 - Mídia + histórico

- Mídia recebida (foto, áudio, documento) com preview
- Mídia enviada (anexar arquivo no form)
- Importar histórico do Evolution (background job)

## Sprint 3 - Organização

- `/contatos`: CRUD, busca, notas, status, fonte
- `/etiquetas`: labels coloridas, atribuição em conversas
- `/quick-replies`: respostas prontas, atalhos de texto

## Sprint 4 - Pipeline

- Kanban: colunas customizáveis, drag-and-drop, WIP limits
- Filtros (etiqueta, agente, status)
- Vínculo conversa ↔ card

## Sprint 5 - Multi-agente

- `UserInvite`: convidar agentes por email + token
- `ConversationAssignment`: atribuir conversa, indicador "atendendo: X"
- Notificações personalizadas por agente

## Sprint 6 - Automações

- Triggers por keyword
- Auto-atribuição e auto-label
- Follow-ups (mensagem por inatividade)
- Cron job processando filas (Vercel Cron)

## Sprint 7 - Inteligência

- **Analytics**: conversas/dia, tempo de resposta, taxa de conversão
- **IA (Fase 9)**: AgentConfig por workspace, tool use com API de produtos, modo automático/sugestão
