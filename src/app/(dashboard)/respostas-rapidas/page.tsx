import { redirect } from "next/navigation";

export default function RespostasRapidasRedirect() {
  redirect("/configuracoes?tab=respostas-rapidas");
}
