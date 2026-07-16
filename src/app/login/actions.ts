"use server";

import { headers } from "next/headers";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { checkRateLimit, clientIpFrom, resetRateLimit } from "@/lib/rate-limit";

export type LoginState = { error?: string } | null;

const MAX_ATTEMPTS = 8;
const WINDOW_SEC = 15 * 60; // 15 min

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const ip = clientIpFrom(await headers());
  const key = `login:${email}:${ip}`;

  // Throttle antes de processar (proteção contra bruteforce)
  const limit = await checkRateLimit(key, MAX_ATTEMPTS, WINDOW_SEC);
  if (!limit.ok) {
    return {
      error: `Muitas tentativas. Tente de novo em ${Math.ceil(limit.retryAfterSec / 60)} min.`,
    };
  }

  try {
    await signIn("credentials", {
      email,
      password: formData.get("password"),
      redirectTo: "/dashboard",
    });
    // Login bem-sucedido (na prática a action redireciona antes de chegar aqui via throw)
    await resetRateLimit(key);
    return null;
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return { error: "Email ou senha inválidos." };
      }
      return { error: "Erro ao fazer login. Tente de novo." };
    }
    // NEXT_REDIRECT é jogado pelo signIn quando dá certo - propagar pra Next tratar
    throw error;
  }
}
