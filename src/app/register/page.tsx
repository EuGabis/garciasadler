import { notFound } from "next/navigation";
import { RegisterForm } from "./register-form";

// Força dynamic rendering — necessário pra CSP nonce funcionar.
export const dynamic = "force-dynamic";

// Registro público fica fechado por padrão. Pra reabrir temporariamente:
// setar ENABLE_PUBLIC_REGISTRATION=true nas env vars do Vercel.
// O server action também checa essa env (defense in depth).
export default function RegisterPage() {
  if (process.env.ENABLE_PUBLIC_REGISTRATION !== "true") {
    notFound();
  }
  return <RegisterForm />;
}
