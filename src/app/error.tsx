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
    <main className="min-h-screen flex items-center justify-center bg-stone-950 text-stone-100 p-6">
      <div className="w-full max-w-md text-center glass rounded-2xl p-8">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-red-500/15 text-red-300 ring-1 ring-red-500/30 flex items-center justify-center mb-4 text-2xl">
          ⚠
        </div>
        <h1 className="font-display text-2xl text-white tracking-tighter">Algo deu errado</h1>
        <p className="mt-2 text-sm text-stone-400">
          Tivemos um problema ao processar essa página. O erro foi registrado e a equipe vai
          revisar.
        </p>
        {error.digest && (
          <p className="mt-2 text-[10px] font-mono text-stone-500">ref: {error.digest}</p>
        )}

        <div className="mt-6 flex items-center justify-center gap-2">
          <Button type="button" onClick={() => reset()}>
            Tentar novamente
          </Button>
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-stone-200 text-sm font-medium transition"
          >
            Ir pro dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
