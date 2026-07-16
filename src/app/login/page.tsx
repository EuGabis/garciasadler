import { LoginForm } from "./login-form";

// Força dynamic rendering - necessário pra CSP nonce funcionar (cada request
// precisa de nonce fresco). Sem isso, a página seria prerendered estática
// e os scripts não bateriam com o nonce do response header.
export const dynamic = "force-dynamic";

export default function LoginPage() {
  return <LoginForm />;
}
