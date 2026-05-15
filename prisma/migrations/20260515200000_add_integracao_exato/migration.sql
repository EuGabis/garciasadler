-- CreateTable
CREATE TABLE "IntegracaoExato" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "usuario" TEXT NOT NULL,
    "senhaEncrypted" TEXT NOT NULL,
    "lojaId" INTEGER,
    "lojaNome" TEXT,
    "lojaCodigoAcesso" TEXT,
    "tokenAtual" TEXT,
    "refreshToken" TEXT,
    "tokenExpiraEm" TIMESTAMP(3),
    "ultimoLoginEm" TIMESTAMP(3),
    "ultimoErro" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegracaoExato_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IntegracaoExato_workspaceId_key" ON "IntegracaoExato"("workspaceId");

-- AddForeignKey
ALTER TABLE "IntegracaoExato" ADD CONSTRAINT "IntegracaoExato_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
