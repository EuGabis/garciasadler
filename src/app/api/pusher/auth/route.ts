import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { getPusherServer, workspaceChannel } from "@/lib/pusher-server";

export const dynamic = "force-dynamic";

/**
 * Autorização Pusher pra canais privados.
 * Valida: usuário logado + canal pertence ao workspace dele.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Não autenticado", { status: 401 });
  }

  const form = await req.formData();
  const socketId = String(form.get("socket_id") ?? "");
  const channelName = String(form.get("channel_name") ?? "");

  if (!socketId || !channelName) {
    return new Response("Parâmetros faltando", { status: 400 });
  }

  // S2-09: workspaceId vem da sessão (server-side), mas validamos formato
  // como defesa em profundidade (cuid: a-z0-9, 20-32 chars).
  if (!/^[a-z0-9]{20,40}$/i.test(session.user.workspaceId)) {
    return new Response("workspaceId inválido", { status: 400 });
  }

  const expected = workspaceChannel(session.user.workspaceId);
  if (channelName !== expected) {
    return new Response("Canal proibido pra este usuário", { status: 403 });
  }

  const pusher = getPusherServer();
  if (!pusher) {
    return new Response("Pusher não configurado", { status: 503 });
  }

  const authResponse = pusher.authorizeChannel(socketId, channelName);
  return Response.json(authResponse);
}
