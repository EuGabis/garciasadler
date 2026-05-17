-- Sprint IA: novas conversas começam com aiEnabled=true por default.
-- Conversa existente fica como está (não altera valores atuais).
ALTER TABLE "Conversation" ALTER COLUMN "aiEnabled" SET DEFAULT true;
