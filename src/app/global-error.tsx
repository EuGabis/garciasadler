"use client";

import { useEffect } from "react";
import { reportClientError } from "./report-error-action";

/**
 * Captura erros que estouram fora do layout (raros mas críticos).
 * Renderiza o <html>/<body> inteiro porque o layout normal não foi montado.
 */
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError({
      scope: "app/global-error",
      message: error.message,
      stack: error.stack ?? null,
      digest: error.digest ?? null,
      url: typeof window !== "undefined" ? window.location.href : null,
    }).catch(() => {});
  }, [error]);

  return (
    <html lang="pt-BR">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          margin: 0,
          padding: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0c0a09",
          color: "#fafaf9",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 420, padding: 24 }}>
          <div style={{ fontSize: 48 }}>⚠</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: "16px 0 8px" }}>
            Erro crítico
          </h1>
          <p style={{ color: "#a8a29e", fontSize: 14, margin: 0 }}>
            Tivemos um problema sério ao carregar a aplicação. O erro foi registrado.
          </p>
          {error.digest && (
            <p style={{ fontFamily: "monospace", fontSize: 11, color: "#78716c", marginTop: 12 }}>
              ref: {error.digest}
            </p>
          )}
          <a
            href="/"
            style={{
              display: "inline-block",
              marginTop: 24,
              padding: "10px 18px",
              background: "#b5491a",
              color: "#fff",
              borderRadius: 8,
              textDecoration: "none",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Voltar pro início
          </a>
        </div>
      </body>
    </html>
  );
}
