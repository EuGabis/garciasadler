"use client";

import { useActionState } from "react";
import { Globe, Key, Smartphone, Save } from "lucide-react";
import { updateWorkspaceAction, type WorkspaceState } from "./actions";
import {
  Section,
  StatusPill,
  INPUT_CLS,
  LABEL_CLS,
  BTN_PRIMARY,
  ERROR_BOX,
  SUCCESS_BOX,
} from "./_ui";

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
    <form action={formAction} className="space-y-3">
      <Section title="Dados do workspace" description="Informações públicas do seu CRM.">
        <div className="space-y-4">
          <div>
            <label htmlFor="workspaceName" className={LABEL_CLS}>
              Nome
            </label>
            <input
              id="workspaceName"
              name="workspaceName"
              required
              minLength={2}
              maxLength={80}
              defaultValue={workspace.name}
              disabled={!canEdit}
              className={INPUT_CLS}
            />
            <p className="mt-1.5 text-[11.5px] text-stone-500">
              Slug:{" "}
              <code className="bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded text-[10.5px] font-mono text-stone-700 dark:text-stone-300">
                {workspace.slug}
              </code>{" "}
              (não editável)
            </p>
          </div>
        </div>
      </Section>

      <Section
        title="Evolution API"
        description="Conexão com WhatsApp via Evolution."
        actions={
          <StatusPill variant={isConnected ? "success" : "warning"}>
            {isConnected ? "Configurada" : "Pendente"}
          </StatusPill>
        }
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="evolutionUrl" className={`${LABEL_CLS} flex items-center gap-1.5`}>
              <Globe className="h-3 w-3" /> URL do servidor
            </label>
            <input
              id="evolutionUrl"
              name="evolutionUrl"
              type="url"
              placeholder="https://sua-evolution.exemplo.com"
              defaultValue={workspace.evolutionUrl ?? ""}
              disabled={!canEdit}
              className={INPUT_CLS}
            />
          </div>
          <div>
            <label
              htmlFor="evolutionInstance"
              className={`${LABEL_CLS} flex items-center gap-1.5`}
            >
              <Smartphone className="h-3 w-3" /> Nome da instância
            </label>
            <input
              id="evolutionInstance"
              name="evolutionInstance"
              placeholder="Garcia Sadler"
              defaultValue={workspace.evolutionInstance ?? ""}
              disabled={!canEdit}
              className={INPUT_CLS}
            />
          </div>
          <div>
            <label htmlFor="evolutionKey" className={`${LABEL_CLS} flex items-center gap-1.5`}>
              <Key className="h-3 w-3" /> API Key
            </label>
            <input
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
              className={INPUT_CLS}
            />
            <p className="mt-1.5 text-[11.5px] text-stone-500 leading-relaxed">
              Criptografada com AES-256-GCM. O valor nunca volta para o navegador depois de
              salvo - para trocar, digite a chave nova; para manter, não mexa.
            </p>
          </div>
        </div>
      </Section>

      {state?.ok && <p className={SUCCESS_BOX}>Alterações salvas.</p>}
      {state?.error && <p className={ERROR_BOX}>{state.error}</p>}

      {canEdit && (
        <div className="flex justify-end pt-1">
          <button type="submit" disabled={pending} className={BTN_PRIMARY}>
            <Save className="h-3.5 w-3.5" />
            {pending ? "Salvando…" : "Salvar alterações"}
          </button>
        </div>
      )}
    </form>
  );
}
