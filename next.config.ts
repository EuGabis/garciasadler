import type { NextConfig } from "next";

/**
 * Headers de segurança *fixos* — aplicados em todas as respostas.
 *
 * O Content-Security-Policy é montado dinamicamente em `src/proxy.ts` porque
 * gera nonce por request (mitiga XSS via inline scripts). Aqui ficam só os
 * headers estáticos que não dependem de request.
 */
const SECURITY_HEADERS = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

export default nextConfig;
