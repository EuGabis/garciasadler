import { redirect } from "next/navigation";

export default function EquipeRedirect() {
  redirect("/configuracoes?tab=equipe");
}
