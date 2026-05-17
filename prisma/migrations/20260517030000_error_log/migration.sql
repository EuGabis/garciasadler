-- ErrorLog: persistência de erros pra visualização no painel.
CREATE TABLE "ErrorLog" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT,
    "level" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "errorName" TEXT,
    "stack" TEXT,
    "context" JSONB,
    "requestId" TEXT,
    "userId" TEXT,
    "url" TEXT,
    "ip" TEXT,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ErrorLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ErrorLog_workspaceId_createdAt_idx" ON "ErrorLog"("workspaceId", "createdAt");
CREATE INDEX "ErrorLog_level_createdAt_idx" ON "ErrorLog"("level", "createdAt");
CREATE INDEX "ErrorLog_scope_idx" ON "ErrorLog"("scope");
CREATE INDEX "ErrorLog_acknowledged_idx" ON "ErrorLog"("acknowledged");

ALTER TABLE "ErrorLog" ADD CONSTRAINT "ErrorLog_workspaceId_fkey"
    FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
