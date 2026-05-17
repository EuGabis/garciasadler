import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const log = logger("api/messages/media");

const MIME_BY_TYPE: Record<string, string> = {
  image: "image/jpeg",
  audio: "audio/ogg",
  video: "video/mp4",
  document: "application/octet-stream",
};

/**
 * Serve a mídia de uma mensagem sob demanda.
 * - Exige sessão.
 * - Verifica que a mensagem pertence ao workspace do usuário (defesa contra IDOR).
 * - Retorna binário com Content-Type inferido.
 */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return new Response("Não autenticado", { status: 401 });

  const { id } = await ctx.params;

  const message = await prisma.message.findFirst({
    where: {
      id,
      conversation: { workspaceId: session.user.workspaceId },
    },
    select: {
      type: true,
      mediaBase64: true,
      mediaUrl: true,
      fileName: true,
    },
  });

  if (!message) {
    return new Response("Não encontrado", { status: 404 });
  }

  if (message.mediaBase64) {
    try {
      const buf = Buffer.from(message.mediaBase64, "base64");
      const mime = MIME_BY_TYPE[message.type] ?? "application/octet-stream";
      return new Response(new Uint8Array(buf), {
        status: 200,
        headers: {
          "Content-Type": mime,
          "Cache-Control": "private, max-age=3600",
          ...(message.fileName
            ? { "Content-Disposition": `inline; filename="${encodeURIComponent(message.fileName)}"` }
            : {}),
        },
      });
    } catch (e) {
      log.error("decode failed", e, { messageId: id });
      return new Response("Erro ao decodificar mídia", { status: 500 });
    }
  }

  if (message.mediaUrl) {
    // Sem cache nem reuso — só redireciona pra URL externa do WhatsApp.
    return Response.redirect(message.mediaUrl, 302);
  }

  return new Response("Sem mídia", { status: 404 });
}
