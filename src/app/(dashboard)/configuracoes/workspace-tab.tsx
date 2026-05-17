"use client";

import { useActionState } from "react";
import { Globe, Key, Smartphone, Save } from "lucide-react";
import { Button, Input, Label, SectionCard } from "@/components/ui";
import { updateWorkspaceAction, type WorkspaceState } from "./actions";

type Workspace = {
  name: string;
  slug: string;
  evolutionUrl: string | null;
  hasEvolutionKey: boolean;
  evolutionInstance: string | null;
};

const KEY_UNCHANGED_SENTINEL = "__UNCHANGED__";

export function WorkspaceTab({
  workspace,
  canEdit,
}: {
  workspace: Workspace;
  canEdit: boolean;
}) {
  const [state, formAction, pending] = useActionState<WorkspaceState, FormData>(
    updateWorkspaceAction,
    null
  );

  const isConnected = !!(
    workspace.evolutionUrl &&
    workspace.hasEvolutionKey &&
    workspace.evolutionInstance
  );

  return (
    <div className="space-y-6">
      <SectionCard
        title="Dados do workspace"
        description="Informações públicas do seu CRM."
      >
        <form action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="workspaceName">Nome</Label>
            <Input
              id="workspaceName"
              name="workspaceName"
              required
              minLength={2}
              maxLength={80}
              defaultValue={workspace.name}
              disabled={!canEdit}
            />
            <p className="mt-1.5 text-[10px] uppercase tracking-wider text-stone-500">
              Slug:{" "}
              <code className="bg-white/[0.06] text-stone-300 px-1.5 py-0.5 rounded font-mono normal-case">
                {workspace.slug}
              </code>{" "}
              (não editável)
            </p>
          </div>

          <div className="pt-4 border-t border-white/5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-300">
                Evolution API
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ring-1 ${
                  isConnected
                    ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30"
                    : "bg-amber-500/15 text-amber-300 ring-amber-500/30"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                  }`}
                />
                {isConnected ? "Configurada" : "Pendente"}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="evolutionUrl" className="flex items-center gap-1.5">
                  <Globe className="h-3 w-3" /> URL do servidor
                </Label>
                <Input
                  id="evolutionUrl"
                  name="evolutionUrl"
                  type="url"
                  placeholder="https://sua-evolution.exemplo.com"
                  defaultValue={workspace.evolutionUrl ?? ""}
                  disabled={!canEdit}
                />
              </div>
              <div>
                <Label htmlFor="evolutionInstance" className="flex items-center gap-1.5">
                  <Smartphone className="h-3 w-3" /> Nome da instância
                </Label>
                <Input
                  id="evolutionInstance"
                  name="evolutionInstance"
                  placeholder="Garcia Sadler"
                  defaultValue={workspace.evolutionInstance ?? ""}
                  disabled={!canEdit}
                />
              </div>
              <div>
                <Label htmlFor="evolutionKey" className="flex items-center gap-1.5">
                  <Key className="h-3 w-3" /> API Key
                </Label>
                <Input
                  id="evolutionKey"
                  name="evolutionKey"
                  type="password"
                  autoComplete="off"
                  placeholder={
                    workspace.hasEvolutionKey
                      ? "•••••••••••••• (deixe assim pra manter)"
                      : "Cole sua API key"
                  }
                  defaultValue={workspace.hasEvolutionKey ? KEY_UNCHANGED_SENTINEL : ""}
                  disabled={!canEdit}
                />
                <p className="mt-1.5 text-[11px] text-stone-400">
                  Criptografada com AES-256-GCM. O valor nunca volta pro navegador depois
                  de salvo — pra trocar, digite a chave nova; pra manter, não mexa.
                </p>
              </div>
            </div>
          </div>

          {state?.ok && <p className="text-sm text-emerald-300">Salvo.</p>}
          {state?.error && <p className="text-sm text-red-400">{state.error}</p>}

          {canEdit && (
            <Button type="submit" disabled={pending}>
              <Save className="h-3.5 w-3.5" />
              {pending ? "Salvando..." : "Salvar alterações"}
            </Button>
          )}
        </form>
      </SectionCard>
    </div>
  );
}
