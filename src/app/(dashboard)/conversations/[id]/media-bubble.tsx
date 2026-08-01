import { FileText, Download, Mic } from "lucide-react";

type Variant = "inbound" | "outbound";

type Props = {
  messageId: string;
  type: "image" | "audio" | "video" | "document" | "text" | "location";
  content: string;
  hasMedia: boolean;
  mediaUrl: string | null;
  fileName: string | null;
  transcript?: string | null;
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
  transcript,
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
    const hasTranscript = transcript && transcript.trim().length > 0;
    // Wrapper com w-[260px] max-w-full: casa com a largura do <audio> e
    // impede que uma transcricao longa estique o balao pra fora do 72%
    // do container do chat. min-w-0 no span pro break-words funcionar
    // dentro do flex.
    return (
      <div className="space-y-1.5 w-[260px] max-w-full">
        <div className="rounded-lg bg-white/60 dark:bg-stone-900/60 p-1 -mx-1.5 -my-0.5 ring-1 ring-stone-200/50 dark:ring-stone-700/50">
          <audio
            src={src}
            controls
            preload="none"
            className="block w-full h-9"
          />
        </div>
        {hasTranscript && (
          <div className="flex items-start gap-1.5 text-[12.5px] leading-relaxed italic text-stone-600 dark:text-stone-400">
            <Mic className="h-3 w-3 mt-0.5 shrink-0 opacity-60" />
            <span className="min-w-0 whitespace-pre-wrap break-words">{transcript}</span>
          </div>
        )}
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
        className="flex items-center gap-2 px-3 py-2 rounded-lg transition bg-white/60 dark:bg-stone-900/60 ring-1 ring-stone-200/50 dark:ring-stone-700/50 hover:ring-stone-300 dark:hover:ring-stone-600"
      >
        <FileText className="h-5 w-5 shrink-0 text-stone-500" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{fileName ?? "documento"}</p>
          {content && content !== "[documento]" && (
            <p className="text-xs truncate opacity-70">{content}</p>
          )}
        </div>
        <Download className="h-4 w-4 shrink-0 opacity-60" />
      </a>
    );
  }

  return <p className="whitespace-pre-wrap break-words italic opacity-70">{content}</p>;
}
