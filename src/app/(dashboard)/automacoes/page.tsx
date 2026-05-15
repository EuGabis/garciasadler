import { redirect } from "next/navigation";

export default function AutomacoesRedirect() {
  redirect("/configuracoes?tab=automacoes");
}
