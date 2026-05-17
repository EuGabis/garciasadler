"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui";
import { acknowledgeAllAction, clearOldErrorsAction } from "./logs-actions";

export function LogActions({ hasErrors, unackCount }: { hasErrors: boolean; unackCount: number }) {
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
    <div className="ml-auto flex items-center gap-2">
      {unackCount > 0 && (
        <Button type="button" variant="outline" onClick={ackAll} disabled={pending} size="sm">
          <CheckCheck className="h-3 w-3" />
          Revisar todos
        </Button>
      )}
      {hasErrors && (
        <Button type="button" variant="ghost" onClick={clearOld} disabled={pending} size="sm">
          <Trash2 className="h-3 w-3" />
          Limpar antigos
        </Button>
      )}
    </div>
  );
}
