-- S2-01: previne cross-tenant hijack via evolutionInstance
ALTER TABLE "Workspace" ADD CONSTRAINT "Workspace_evolutionInstance_key" UNIQUE ("evolutionInstance");

-- S2-05: invalidação de JWT após troca de senha
ALTER TABLE "User" ADD COLUMN "passwordChangedAt" TIMESTAMP(3);
