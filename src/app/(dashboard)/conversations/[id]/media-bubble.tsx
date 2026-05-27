import { FileText, Download } from "lucide-react";

type Variant = "inbound" | "outbound";

type Props = {
  messageId: string;
  type: "image" | "audio" | "video" | "document" | "text" | "location";
  content: string;
  hasMedia: boolean;
  mediaUrl: string | null;
  fileName: string | null;
  variant?: Variant;
};

/**
 * Renderiza mídia de uma mensagem. Em vez de carregar base64 inline
 * (custoso em payload RSC), aponta pra `/api/messages/[id]/media` que serve
 * o blob sob demanda com auth + workspace check.
 *
 * `variant` controla o styling adaptativo: bolhas outbound (laranja/brand) ganham
 * containers translúcidos pra que o player nativo do browser não bata com o fundo.
 */
export function MediaBubble({
  messageId,
  type,
  content,
  hasMedia,
  mediaUrl,
  fileName,
  variant = "inbound",
}: Props) {
  if (type === "text") {
    return <p className="whitespace-pre-wrap break-words">{content}</p>;
  }

  const src = hasMedia ? `/api/messages/${messageId}/media` : mediaUrl;
  const isOutbound = variant === "outbound";

  if (type === "image") {
    return (
      <div className="space-y-1.5">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={content || "imagem"}
            loading="lazy"
            className="max-w-[280px] max-h-[280px] rounded-lg object-cover"
          />
        ) : (
          <div className="text-xs italic opacity-70">[imagem indisponível]</div>
        )}
        {content && content !== "[imagem]" && (
          <p className="whitespace-pre-wrap break-words text-sm">{content}</p>
        )}
      </div>
    );
  }

  if (type === "audio") {
    if (!src) {
      return <div className="text-xs italic opacity-70">[áudio indisponível]</div>;
    }
    return (
      <div
        className={
          isOutbound
            ? "rounded-lg bg-black/20 p-1 -mx-1.5 -my-0.5"
            : "rounded-lg bg-stone-100 dark:bg-stone-800/70 p-1 -mx-1.5 -my-0.5"
        }
      >
        <audio
          src={src}
          controls
          preload="none"
          className="block w-[260px] max-w-full h-9"
          style={{ colorScheme: isOutbound ? "dark" : undefined }}
        />
      </div>
    );
  }

  if (type === "video") {
    return (
      <div className="space-y-1.5">
        {src ? (
          <video
            src={src}
            controls
            preload="none"
            className="max-w-[320px] rounded-lg"
            style={{ colorScheme: isOutbound ? "dark" : undefined }}
          />
        ) : (
          <div className="text-xs italic opacity-70">[vídeo indisponível]</div>
        )}
        {content && content !== "[vídeo]" && (
          <p className="whitespace-pre-wrap break-words text-sm">{content}</p>
        )}
      </div>
    );
  }

  if (type === "document") {
    return (
      <a
        href={src ?? "#"}
        download={fileName ?? "documento"}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
          isOutbound
            ? "bg-white/15 hover:bg-white/25 text-white"
            : "bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700"
        }`}
      >
        <FileText
          className={`h-5 w-5 shrink-0 ${isOutbound ? "text-white/80" : "text-stone-500"}`}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{fileName ?? "documento"}</p>
          {content && content !== "[documento]" && (
            <p className={`text-xs truncate ${isOutbound ? "text-white/70" : "opacity-70"}`}>
              {content}
            </p>
          )}
        </div>
        <Download
          className={`h-4 w-4 shrink-0 ${isOutbound ? "text-white/70" : "opacity-60"}`}
        />
      </a>
    );
  }

  return <p className="whitespace-pre-wrap break-words italic opacity-70">{content}</p>;
}
