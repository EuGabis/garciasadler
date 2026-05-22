"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, Trash2 } from "lucide-react";
import { acknowledgeAllAction, clearOldErrorsAction } from "./logs-actions";

export function LogActions({
  hasErrors,
  unackCount,
}: {
  hasErrors: boolean;
  unackCount: number;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function ackAll() {
    if (!confirm(`Marcar todos os ${unackCount} eventos pendentes como revisados?`)) return;
    start(async () => {
      await acknowledgeAllAction();
      router.refresh();
    });
  }

  function clearOld() {
    if (!confirm("Apagar eventos revisados com mais de 30 dias?")) return;
    start(async () => {
      const r = await clearOldErrorsAction();
      alert(`${r.count} eventos antigos apagados.`);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      {unackCount > 0 && (
        <button
          type="button"
          onClick={ackAll}
          disabled={pending}
          className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md text-[11.5px] font-medium border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 disabled:opacity-50 transition-colors"
        >
          <CheckCheck className="h-3 w-3" />
          Revisar todos
        </button>
      )}
      {hasErrors && (
        <button
          type="button"
          onClick={clearOld}
          disabled={pending}
          className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md text-[11.5px] font-medium text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-700 dark:hover:text-stone-300 disabled:opacity-50 transition-colors"
        >
          <Trash2 className="h-3 w-3" />
          Limpar antigos
        </button>
      )}
    </div>
  );
}
