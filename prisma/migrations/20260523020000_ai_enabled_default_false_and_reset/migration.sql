-- Muda default da coluna aiEnabled de true pra false em novas conversas
ALTER TABLE "Conversation" ALTER COLUMN "aiEnabled" SET DEFAULT false;

-- Zera todas as conversas existentes. Operador ativa caso a caso via badge IA.
UPDATE "Conversation" SET "aiEnabled" = false;
