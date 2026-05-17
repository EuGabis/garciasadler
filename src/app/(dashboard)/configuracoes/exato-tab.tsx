"use client";

import { useActionState, useState, useTransition } from "react";
import { Key, User, Save, Plug, Store, Search, Loader2, Check } from "lucide-react";
import { Button, Input, Label, SectionCard } from "@/components/ui";
import {
  saveExatoCredentialsAction,
  testExatoConnectionAction,
  syncExatoLojasAction,
  selectExatoLojaAction,
  searchExatoProdutoAction,
  type ExatoSaveState,
  type ExatoTestState,
  type ExatoSelectLojaState,
  type ExatoSearchState,
  type ExatoLoja,
} from "./exato-actions";

type Integ = {
  hasCredentials: boolean;
  usuario: string | null;
  lojaId: number | null;
  lojaNome: string | null;
  lojaCodigoAcesso: string | null;
  ultimoLoginEm: Date | null;
  ultimoErro: string | null;
};

export function ExatoTab({ integ, canEdit }: { integ: Integ; canEdit: boolean }) {
  return (
    <div className="space-y-6">
      <CredentialsSection integ={integ} canEdit={canEdit} />
      {integ.hasCredentials && <ConnectionSection integ={integ} />}
      {integ.hasCredentials && <LojaSection integ={integ} canEdit={canEdit} />}
      {integ.hasCredentials && integ.lojaCodigoAcesso && <ProdutoSearchSection />}
    </div>
  );
}

// ----- Credenciais -----

function CredentialsSection({ integ, canEdit }: { integ: Integ; canEdit: boolean }) {
  const [state, formAction, pending] = useActionState<ExatoSaveState, FormData>(
    saveExatoCredentialsAction,
    null
  );

  return (
    <SectionCard
      title="Credenciais Exato"
      description="Usuário e senha da API PML Sistemas. Senha é guardada criptografada."
    >
      <form action={formAction} className="space-y-4">
        <div>
          <Label htmlFor="usuario" className="flex items-center gap-1.5">
            <User className="h-3 w-3" /> Usuário
          </Label>
          <Input
            id="usuario"
            name="usuario"
            required
            defaultValue={integ.usuario ?? ""}
            disabled={!canEdit}
            placeholder="ex: GarciaSadler"
          />
        </div>
        <div>
          <Label htmlFor="senha" className="flex items-center gap-1.5">
            <Key className="h-3 w-3" /> Senha
          </Label>
          <Input
            id="senha"
            name="senha"
            type="password"
            required
            disabled={!canEdit}
            placeholder={integ.hasCredentials ? "•••••••• (já salva)" : "Cole a senha"}
            autoComplete="new-password"
          />
          <p className="mt-1 text-[11px] text-stone-500">
            Salvamos só o hash criptografado. Pra trocar a senha, preencha de novo.
          </p>
        </div>

        {state?.ok && <p className="text-sm text-emerald-600">Salvo e testado com sucesso.</p>}
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

        {canEdit && (
          <Button type="submit" disabled={pending}>
            <Save className="h-3.5 w-3.5" />
            {pending ? "Salvando..." : "Salvar e testar"}
          </Button>
        )}
      </form>
    </SectionCard>
  );
}

// ----- Conexão (botão testar) -----

function ConnectionSection({ integ }: { integ: Integ }) {
  const [state, setState] = useState<ExatoTestState>(null);
  const [pending, start] = useTransition();

  return (
    <SectionCard
      title="Status da conexão"
      description="Testa login com as credenciais salvas."
    >
      <div className="space-y-3">
        <div className="text-xs text-stone-500">
          {integ.ultimoLoginEm ? (
            <>
              Último login bem-sucedido em{" "}
              <strong>{new Date(integ.ultimoLoginEm).toLocaleString("pt-BR")}</strong>
            </>
          ) : (
            "Ainda não houve login bem-sucedido."
          )}
          {integ.ultimoErro && (
            <span className="block text-red-600 mt-1">Último erro: {integ.ultimoErro}</span>
          )}
        </div>

        <Button
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await testExatoConnectionAction();
              setState(r);
            })
          }
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plug className="h-3.5 w-3.5" />}
          {pending ? "Testando..." : "Testar conexão"}
        </Button>

        {state?.ok && (
          <p className="text-sm text-emerald-600 flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5" />
            Conectado como <strong>{state.nomeUsuarioLogado}</strong>
          </p>
        )}
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      </div>
    </SectionCard>
  );
}

// ----- Loja (listar + escolher) -----

function LojaSection({ integ, canEdit }: { integ: Integ; canEdit: boolean }) {
  const [lojas, setLojas] = useState<ExatoLoja[] | null>(null);
  const [syncErr, setSyncErr] = useState<string | null>(null);
  const [syncing, startSync] = useTransition();

  const [selectState, selectAction, selectPending] = useActionState<
    ExatoSelectLojaState,
    FormData
  >(selectExatoLojaAction, null);

  return (
    <SectionCard
      title="Loja padrão"
      description="A IA usará o código de acesso desta loja pra consultar produtos e gerar pedidos."
    >
      <div className="space-y-4">
        {integ.lojaNome ? (
          <div className="text-sm">
            <span className="text-stone-500">Loja atual: </span>
            <strong>{integ.lojaNome}</strong>
            <span className="text-stone-500"> (id {integ.lojaId})</span>
          </div>
        ) : (
          <div className="text-sm text-amber-700 dark:text-amber-400">
            Nenhuma loja selecionada. Sincronize e escolha uma abaixo.
          </div>
        )}

        <Button
          type="button"
          variant="secondary"
          disabled={syncing}
          onClick={() =>
            startSync(async () => {
              setSyncErr(null);
              const r = await syncExatoLojasAction();
              if (r?.error) {
                setSyncErr(r.error);
                setLojas(null);
              } else {
                setLojas(r?.lojas ?? []);
              }
            })
          }
        >
          {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Store className="h-3.5 w-3.5" />}
          {syncing ? "Sincronizando..." : "Sincronizar lojas"}
        </Button>

        {syncErr && <p className="text-sm text-red-600">{syncErr}</p>}

        {lojas && lojas.length === 0 && (
          <p className="text-sm text-stone-500">Nenhuma loja acessível por este usuário.</p>
        )}

        {lojas && lojas.length > 0 && (
          <div className="border border-stone-200 dark:border-stone-800 rounded-lg divide-y divide-stone-100 dark:divide-stone-800">
            {lojas.map((l) => {
              const isActive = integ.lojaCodigoAcesso === l.codigoAcesso;
              return (
                <form
                  key={l.codigoAcesso}
                  action={selectAction}
                  className="flex items-center justify-between gap-3 p-3"
                >
                  <input type="hidden" name="codigoAcesso" value={l.codigoAcesso} />
                  <input type="hidden" name="lojaId" value={l.id} />
                  <input type="hidden" name="lojaNome" value={l.nome} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {l.nome} {l.nomeFantasia ? <span className="text-stone-500">({l.nomeFantasia})</span> : null}
                    </p>
                    <p className="text-[11px] text-stone-500">
                      id {l.id} · {l.cidade ?? "—"}/{l.uf ?? "—"}
                    </p>
                  </div>
                  {canEdit &&
                    (isActive ? (
                      <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                        <Check className="h-3 w-3" /> Selecionada
                      </span>
                    ) : (
                      <Button type="submit" size="sm" variant="secondary" disabled={selectPending}>
                        Usar esta
                      </Button>
                    ))}
                </form>
              );
            })}
          </div>
        )}

        {selectState?.ok && (
          <p className="text-sm text-emerald-600">Loja salva. Recarregue se não atualizar sozinho.</p>
        )}
        {selectState?.error && <p className="text-sm text-red-600">{selectState.error}</p>}
      </div>
    </SectionCard>
  );
}

// ----- Busca produto (teste) -----

function ProdutoSearchSection() {
  const [state, formAction, pending] = useActionState<ExatoSearchState, FormData>(
    searchExatoProdutoAction,
    null
  );

  return (
    <SectionCard
      title="Buscar produto (teste)"
      description="Confirma que a busca de produtos está funcionando com a loja selecionada."
    >
      <form action={formAction} className="space-y-3">
        <div className="flex gap-2">
          <Input
            name="termo"
            placeholder="ex: cimento, ABCD123, ou descrição parcial"
            defaultValue={state?.termo ?? ""}
          />
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
            {pending ? "Buscando..." : "Buscar"}
          </Button>
        </div>

        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

        {state?.produtos && state.produtos.length === 0 && (
          <p className="text-sm text-stone-500">Nenhum produto encontrado pra esse termo.</p>
        )}

        {state?.produtos && state.produtos.length > 0 && (
          <div className="border border-stone-200 dark:border-stone-800 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 dark:bg-stone-900/50 text-xs uppercase tracking-wider text-stone-500">
                <tr>
                  <th className="text-left px-3 py-2">Código</th>
                  <th className="text-left px-3 py-2">Descrição</th>
                  <th className="text-left px-3 py-2">Marca</th>
                  <th className="text-right px-3 py-2">Preço</th>
                  <th className="text-right px-3 py-2">Estoque</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {state.produtos.map((p) => (
                  <tr key={p.id}>
                    <td className="px-3 py-2 font-mono text-xs">{p.codigo}</td>
                    <td className="px-3 py-2">{p.descricao}</td>
                    <td className="px-3 py-2 text-stone-500">{p.marca ?? "—"}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      R$ {p.precoVenda.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {p.estoque} {p.unidade ?? ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </form>
    </SectionCard>
  );
}
