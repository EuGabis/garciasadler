import { FileText, Download } from "lucide-react";

type Props = {
  messageId: string;
  type: "image" | "audio" | "video" | "document" | "text" | "location";
  content: string;
  hasMedia: boolean;
  mediaUrl: string | null;
  fileName: string | null;
};

/**
 * Renderiza mídia de uma mensagem. Em vez de carregar base64 inline
 * (custoso em payload RSC), aponta pra `/api/messages/[id]/media` que serve
 * o blob sob demanda com auth + workspace check.
 */
export function MediaBubble({ messageId, type, content, hasMedia, mediaUrl, fileName }: Props) {
  if (type === "text") {
    return <p className="whitespace-pre-wrap break-words">{content}</p>;
  }

  const src = hasMedia ? `/api/messages/${messageId}/media` : mediaUrl;

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
    return src ? (
      <audio src={src} controls className="max-w-[280px]" preload="none" />
    ) : (
      <div className="text-xs italic opacity-70">[áudio indisponível]</div>
    );
  }

  if (type === "video") {
    return (
      <div className="space-y-1.5">
        {src ? (
          <video src={src} controls className="max-w-[320px] rounded-lg" preload="none" />
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
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] ring-1 ring-white/10 transition"
      >
        <FileText className="h-5 w-5 shrink-0 text-stone-400" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{fileName ?? "documento"}</p>
          {content && content !== "[documento]" && (
            <p className="text-xs opacity-70 truncate">{content}</p>
          )}
        </div>
        <Download className="h-4 w-4 shrink-0 opacity-60" />
      </a>
    );
  }

  return <p className="whitespace-pre-wrap break-words italic opacity-70">{content}</p>;
}
