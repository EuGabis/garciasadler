import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

/**
 * Proxy do Next 16:
 *  1. Roda gate de auth (NextAuth — usa `authorized` callback em auth.config).
 *  2. Gera nonce CSP único por request e seta:
 *      - request header `x-nonce` (Next.js lê e injeta nos scripts framework/page).
 *      - request header `Content-Security-Policy` (Next.js parseia pra extrair nonce).
 *      - response header `Content-Security-Policy` (browser enforça).
 *
 * Resultado: XSS via inline script bloqueado em prod sem mais `unsafe-inline`
 * em script-src. Custo: /login e /register saem do prerender estático e viram
 * dinâmicos (uma única passagem extra de SSR — irrelevante na latência).
 */
export default auth((req) => {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";

  // Em dev, React precisa de 'unsafe-eval' pra reconstruir stacks de erro.
  // Em prod, nem React nem Next usam eval — pode ser removido.
  const scriptSrcDev = isDev ? " 'unsafe-eval'" : "";

  const cspHeader = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${scriptSrcDev}`,
    // Tailwind 4 + componentes com style={{...}} usam inline styles em runtime.
    // 'unsafe-inline' aqui é OK — vetor de XSS via style é muito mais fraco que via script.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "media-src 'self' data: blob:",
    "font-src 'self' data:",
    // Pusher (WSS) + endpoint próprio.
    "connect-src 'self' wss://*.pusher.com https://*.pusher.com https://*.pusherapp.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  // Next.js lê CSP da request header pra saber qual nonce usar no SSR.
  requestHeaders.set("Content-Security-Policy", cspHeader);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  // Browser enforça a partir da response header.
  response.headers.set("Content-Security-Policy", cspHeader);
  return response;
});

export const config = {
  matcher: [
    // Cobre todas as páginas, exclui assets/APIs (API tem CSP herdado dos
    // security headers e geralmente serve JSON — CSP não se aplica).
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg).*)",
  ],
};
