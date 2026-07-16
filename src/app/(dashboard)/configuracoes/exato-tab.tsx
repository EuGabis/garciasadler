"use client";

import { useActionState, useState, useTransition } from "react";
import { Key, User, Save, Plug, Store, Search, Loader2, Check } from "lucide-react";
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
import {
  Section,
  INPUT_CLS,
  LABEL_CLS,
  BTN_PRIMARY,
  BTN_SECONDARY,
  ERROR_BOX,
  SUCCESS_BOX,
} from "./_ui";

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
    <div className="space-y-3">
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
    <Section
      title="Credenciais Exato"
      description="Usuário e senha da API PML Sistemas. Senha guardada criptografada."
    >
      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="usuario" className={`${LABEL_CLS} flex items-center gap-1.5`}>
            <User className="h-3 w-3" /> Usuário
          </label>
          <input
            id="usuario"
            name="usuario"
            required
            defaultValue={integ.usuario ?? ""}
            disabled={!canEdit}
            placeholder="ex: GarciaSadler"
            className={INPUT_CLS}
          />
        </div>
        <div>
          <label htmlFor="senha" className={`${LABEL_CLS} flex items-center gap-1.5`}>
            <Key className="h-3 w-3" /> Senha
          </label>
          <input
            id="senha"
            name="senha"
            type="password"
            required
            disabled={!canEdit}
            placeholder={integ.hasCredentials ? "•••••••• (já salva)" : "Cole a senha"}
            autoComplete="new-password"
            className={INPUT_CLS}
          />
          <p className="mt-1.5 text-[11.5px] text-stone-500">
            Salvamos só o hash criptografado. Para trocar a senha, preencha de novo.
          </p>
        </div>

        {state?.ok && <p className={SUCCESS_BOX}>Salvo e testado com sucesso.</p>}
        {state?.error && <p className={ERROR_BOX}>{state.error}</p>}

        {canEdit && (
          <div className="flex justify-end">
            <button type="submit" disabled={pending} className={BTN_PRIMARY}>
              <Save className="h-3.5 w-3.5" />
              {pending ? "Salvando…" : "Salvar e testar"}
            </button>
          </div>
        )}
      </form>
    </Section>
  );
}

// ----- Conexão -----

function ConnectionSection({ integ }: { integ: Integ }) {
  const [state, setState] = useState<ExatoTestState>(null);
  const [pending, start] = useTransition();

  return (
    <Section title="Status da conexão" description="Teste login com as credenciais salvas.">
      <div className="space-y-3">
        <div className="text-[12.5px] text-stone-600 dark:text-stone-400">
          {integ.ultimoLoginEm ? (
            <>
              Último login bem-sucedido em{" "}
              <strong className="text-stone-900 dark:text-stone-50 font-semibold">
                {new Date(integ.ultimoLoginEm).toLocaleString("pt-BR")}
              </strong>
            </>
          ) : (
            "Ainda não houve login bem-sucedido."
          )}
          {integ.ultimoErro && (
            <span className="block text-red-600 dark:text-red-400 mt-1.5">
              Último erro: {integ.ultimoErro}
            </span>
          )}
        </div>

        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await testExatoConnectionAction();
              setState(r);
            })
          }
          className={BTN_SECONDARY}
        >
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plug className="h-3.5 w-3.5" />
          )}
          {pending ? "Testando…" : "Testar conexão"}
        </button>

        {state?.ok && (
          <p className={`${SUCCESS_BOX} flex items-center gap-1.5`}>
            <Check className="h-3.5 w-3.5" />
            Conectado como <strong>{state.nomeUsuarioLogado}</strong>
          </p>
        )}
        {state?.error && <p className={ERROR_BOX}>{state.error}</p>}
      </div>
    </Section>
  );
}

// ----- Loja -----

function LojaSection({ integ, canEdit }: { integ: Integ; canEdit: boolean }) {
  const [lojas, setLojas] = useState<ExatoLoja[] | null>(null);
  const [syncErr, setSyncErr] = useState<string | null>(null);
  const [syncing, startSync] = useTransition();

  const [selectState, selectAction, selectPending] = useActionState<
    ExatoSelectLojaState,
    FormData
  >(selectExatoLojaAction, null);

  return (
    <Section
      title="Loja padrão"
      description="A IA usa o código de acesso desta loja para consultar produtos e gerar pedidos."
    >
      <div className="space-y-4">
        {integ.lojaNome ? (
          <div className="text-[13px] flex items-center gap-2">
            <span className="text-stone-500">Loja atual:</span>
            <strong className="font-semibold text-stone-900 dark:text-stone-50">
              {integ.lojaNome}
            </strong>
            <span className="text-stone-400 text-[11.5px] tabular-nums">id {integ.lojaId}</span>
          </div>
        ) : (
          <div className="text-[12.5px] text-amber-700 dark:text-amber-400 px-3 py-2 rounded-md bg-amber-50 dark:bg-amber-500/10 ring-1 ring-amber-200/60 dark:ring-amber-500/20">
            Nenhuma loja selecionada. Sincronize e escolha uma abaixo.
          </div>
        )}

        <button
          type="button"
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
          className={BTN_SECONDARY}
        >
          {syncing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Store className="h-3.5 w-3.5" />
          )}
          {syncing ? "Sincronizando…" : "Sincronizar lojas"}
        </button>

        {syncErr && <p className={ERROR_BOX}>{syncErr}</p>}

        {lojas && lojas.length === 0 && (
          <p className="text-[12.5px] text-stone-500">
            Nenhuma loja acessível por este usuário.
          </p>
        )}

        {lojas && lojas.length > 0 && (
          <div className="border border-stone-200/80 dark:border-stone-800/80 rounded-lg divide-y divide-stone-100 dark:divide-stone-800/60 overflow-hidden">
            {lojas.map((l) => {
              const isActive = integ.lojaCodigoAcesso === l.codigoAcesso;
              return (
                <form
                  key={l.codigoAcesso}
                  action={selectAction}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors"
                >
                  <input type="hidden" name="codigoAcesso" value={l.codigoAcesso} />
                  <input type="hidden" name="lojaId" value={l.id} />
                  <input type="hidden" name="lojaNome" value={l.nome} />
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold tracking-tight truncate text-stone-900 dark:text-stone-50">
                      {l.nome}{" "}
                      {l.nomeFantasia && (
                        <span className="text-stone-500 font-normal">({l.nomeFantasia})</span>
                      )}
                    </p>
                    <p className="text-[11.5px] text-stone-500 tabular-nums">
                      id {l.id} · {l.cidade ?? "-"}/{l.uf ?? "-"}
                    </p>
                  </div>
                  {canEdit &&
                    (isActive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 ring-1 ring-emerald-200/60 dark:ring-emerald-500/20">
                        <Check className="h-3 w-3" /> Selecionada
                      </span>
                    ) : (
                      <button
                        type="submit"
                        disabled={selectPending}
                        className="h-8 px-3 rounded-md border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 text-[12px] font-medium text-stone-700 dark:text-stone-300 transition-colors"
                      >
                        Usar esta
                      </button>
                    ))}
                </form>
              );
            })}
          </div>
        )}

        {selectState?.ok && (
          <p className={SUCCESS_BOX}>Loja salva. Recarregue se não atualizar sozinho.</p>
        )}
        {selectState?.error && <p className={ERROR_BOX}>{selectState.error}</p>}
      </div>
    </Section>
  );
}

// ----- Busca produto -----

function ProdutoSearchSection() {
  const [state, formAction, pending] = useActionState<ExatoSearchState, FormData>(
    searchExatoProdutoAction,
    null
  );

  return (
    <Section
      title="Buscar produto (teste)"
      description="Confirma que a busca de produtos está funcionando com a loja selecionada."
    >
      <form action={formAction} className="space-y-3">
        <div className="flex gap-2">
          <input
            name="termo"
            placeholder="ex: cimento, ABCD123, ou descrição parcial"
            defaultValue={state?.termo ?? ""}
            className={INPUT_CLS}
          />
          <button type="submit" disabled={pending} className={BTN_PRIMARY}>
            {pending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Search className="h-3.5 w-3.5" />
            )}
            {pending ? "Buscando…" : "Buscar"}
          </button>
        </div>

        {state?.error && <p className={ERROR_BOX}>{state.error}</p>}

        {state?.produtos && state.produtos.length === 0 && (
          <p className="text-[12.5px] text-stone-500">
            Nenhum produto encontrado para esse termo.
          </p>
        )}

        {state?.produtos && state.produtos.length > 0 && (
          <div className="border border-stone-200/80 dark:border-stone-800/80 rounded-lg overflow-x-auto">
            <table className="w-full text-[12.5px] min-w-[520px]">
              <thead className="bg-stone-50 dark:bg-stone-800/40 text-[10.5px] uppercase tracking-[0.08em] text-stone-500 font-semibold">
                <tr>
                  <th className="text-left px-3 py-2.5">Código</th>
                  <th className="text-left px-3 py-2.5">Descrição</th>
                  <th className="text-left px-3 py-2.5">Marca</th>
                  <th className="text-right px-3 py-2.5">Preço</th>
                  <th className="text-right px-3 py-2.5">Estoque</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
                {state.produtos.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-stone-50 dark:hover:bg-stone-800/30 transition-colors"
                  >
                    <td className="px-3 py-2 font-mono text-[11px] text-stone-700 dark:text-stone-300">
                      {p.codigo}
                    </td>
                    <td className="px-3 py-2 text-stone-900 dark:text-stone-100">
                      {p.descricao}
                    </td>
                    <td className="px-3 py-2 text-stone-500">{p.marca ?? "-"}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-stone-900 dark:text-stone-100 font-medium">
                      R$ {p.precoVenda.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-stone-700 dark:text-stone-300">
                      {p.estoque} {p.unidade ?? ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </form>
    </Section>
  );
}
