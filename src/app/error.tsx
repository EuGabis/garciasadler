"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { reportClientError } from "./report-error-action";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Reporta o erro pro server (que persiste em ErrorLog).
    reportClientError({
      scope: "app/error-boundary",
      message: error.message,
      stack: error.stack ?? null,
      digest: error.digest ?? null,
      url: typeof window !== "undefined" ? window.location.href : null,
    }).catch(() => {
      // silencioso
    });
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 p-6">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-red-500/10 text-red-600 flex items-center justify-center mb-4 text-2xl">
          ⚠
        </div>
        <h1 className="text-xl font-bold tracking-tight">Algo deu errado</h1>
        <p className="mt-2 text-sm text-stone-500">
          Tivemos um problema ao processar essa página. O erro foi registrado e a equipe vai
          revisar.
        </p>
        {error.digest && (
          <p className="mt-2 text-[10px] font-mono text-stone-400">ref: {error.digest}</p>
        )}

        <div className="mt-6 flex items-center justify-center gap-2">
          <Button type="button" onClick={() => reset()}>
            Tentar novamente
          </Button>
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-lg bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-sm font-medium transition"
          >
            Ir pro dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
