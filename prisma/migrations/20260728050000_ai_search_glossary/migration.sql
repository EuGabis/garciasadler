-- Glossario tecnico do lojista, injetado no system prompt da IA
-- pra dar contexto de vocabulario do deposito (traducao termo cliente -> Exato).
ALTER TABLE "AgentConfig" ADD COLUMN "searchGlossary" TEXT;
