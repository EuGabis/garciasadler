import { FileText, Download } from "lucide-react";

type Props = {
  type: "image" | "audio" | "video" | "document" | "text" | "location";
  content: string;
  mediaBase64: string | null;
  mediaUrl: string | null;
  fileName: string | null;
};

function dataUrl(base64: string, mime: string): string {
  // base64 do Evolution costuma vir sem prefixo; assume formato cru
  return base64.startsWith("data:") ? base64 : `data:${mime};base64,${base64}`;
}

export function MediaBubble({ type, content, mediaBase64, mediaUrl, fileName }: Props) {
  if (type === "text") {
    return <p className="whitespace-pre-wrap break-words">{content}</p>;
  }

  if (type === "image") {
    const src = mediaBase64
      ? dataUrl(mediaBase64, "image/jpeg")
      : mediaUrl ?? null;
    return (
      <div className="space-y-1.5">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={content || "imagem"}
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
    const src = mediaBase64
      ? dataUrl(mediaBase64, "audio/ogg")
      : mediaUrl ?? null;
    return src ? (
      <audio src={src} controls className="max-w-[280px]" preload="metadata" />
    ) : (
      <div className="text-xs italic opacity-70">[áudio indisponível]</div>
    );
  }

  if (type === "video") {
    const src = mediaBase64
      ? dataUrl(mediaBase64, "video/mp4")
      : mediaUrl ?? null;
    return (
      <div className="space-y-1.5">
        {src ? (
          <video src={src} controls className="max-w-[320px] rounded-lg" preload="metadata" />
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
    const src = mediaBase64
      ? dataUrl(mediaBase64, "application/octet-stream")
      : mediaUrl ?? null;
    return (
      <a
        href={src ?? "#"}
        download={fileName ?? "documento"}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
      >
        <FileText className="h-5 w-5 shrink-0 text-zinc-500" />
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
