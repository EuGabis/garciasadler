"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { seedDefaultColumnsAction } from "./actions";

export function SeedButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      onClick={() =>
        start(async () => {
          const r = await seedDefaultColumnsAction();
          if (r.error) alert(r.error);
          router.refresh();
        })
      }
      disabled={pending}
      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-orange-500 hover:bg-brand-orange-600 disabled:opacity-60 text-white text-sm font-medium transition"
    >
      <Sparkles className="h-3.5 w-3.5" />
      {pending ? "Criando..." : "Criar colunas padrão (5 etapas)"}
    </button>
  );
}
