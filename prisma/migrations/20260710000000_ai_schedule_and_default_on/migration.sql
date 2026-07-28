-- Janela horária opcional na config de IA (America/Sao_Paulo, 0-23).
-- Ambos NULL = IA 24h. Ambos setados = janela [start, end).
ALTER TABLE "AgentConfig"
  ADD COLUMN "scheduleStartHour" INTEGER,
  ADD COLUMN "scheduleEndHour"   INTEGER;

-- Novas conversas já vêm com IA ligada por padrão (opt-out via badge).
ALTER TABLE "Conversation"
  ALTER COLUMN "aiEnabled" SET DEFAULT true;
