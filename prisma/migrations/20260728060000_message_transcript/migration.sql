-- Transcricao Whisper pra mensagens de audio.
-- IA le transcript no lugar de content quando disponivel.
ALTER TABLE "Message" ADD COLUMN "transcript" TEXT;
