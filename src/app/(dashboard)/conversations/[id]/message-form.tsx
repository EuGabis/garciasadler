"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Send, Paperclip, X, Sparkles } from "lucide-react";
import { sendMessageAction, sendMediaAction, type SendState } from "./actions";

type QuickReply = { id: string; title: string; content: string };

export function MessageForm({
  conversationId,
  quickReplies,
}: {
  conversationId: string;
  quickReplies: QuickReply[];
}) {
  const [textState, textAction, textPending] = useActionState<SendState, FormData>(
    sendMessageAction,
    null
  );
  const [mediaState, mediaAction, mediaPending] = useActionState<SendState, FormData>(
    sendMediaAction,
    null
  );

  const textFormRef = useRef<HTMLFormElement>(null);
  const mediaFormRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const [quickOpen, setQuickOpen] = useState(false);

  useEffect(() => {
    if (textState?.ok) textFormRef.current?.reset();
  }, [textState]);

  useEffect(() => {
    if (mediaState?.ok) {
      mediaFormRef.current?.reset();
      setPickedFile(null);
    }
  }, [mediaState]);

  const error = textState?.error ?? mediaState?.error;
  const pending = textPending || mediaPending;

  function applyQuickReply(content: string) {
    setQuickOpen(false);
    if (textareaRef.current) {
      textareaRef.current.value = content;
      textareaRef.current.focus();
    }
  }

  if (pickedFile) {
    const previewUrl = URL.createObjectURL(pickedFile);
    const isImage = pickedFile.type.startsWith("image/");
    return (
      <form
        ref={mediaFormRef}
        action={mediaAction}
        className="border-t border-white/5 bg-stone-950/70 p-3"
        encType="multipart/form-data"
      >
        <input type="hidden" name="conversationId" value={conversationId} />
        <input
          ref={fileInputRef}
          type="file"
          name="file"
          className="hidden"
          onChange={(e) => setPickedFile(e.target.files?.[0] ?? null)}
        />

        <div className="flex items-center gap-3 mb-2 px-2 py-1.5 rounded-lg bg-white/[0.04] border border-white/5">
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="" className="h-10 w-10 rounded object-cover" />
          ) : (
            <Paperclip className="h-5 w-5 text-stone-400" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate text-stone-100">{pickedFile.name}</p>
            <p className="text-[10px] text-stone-400">
              {(pickedFile.size / 1024).toFixed(0)} KB
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setPickedFile(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            className="text-stone-500 hover:text-stone-200 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-2 items-end">
          <input
            name="caption"
            placeholder="Legenda (opcional)"
            className="flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-stone-100 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-brand-500/60"
          />
          <button
            type="submit"
            disabled={pending}
            className="shrink-0 h-9 px-3 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-sm font-medium flex items-center gap-1.5 shadow-brand-glow"
          >
            <Send className="h-3.5 w-3.5" />
            {pending ? "..." : "Enviar"}
          </button>
        </div>
        {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
      </form>
    );
  }

  return (
    <form
      ref={textFormRef}
      action={textAction}
      className="relative border-t border-white/5 bg-stone-950/70 p-3"
    >
      <input type="hidden" name="conversationId" value={conversationId} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/zip"
        className="hidden"
        onChange={(e) => setPickedFile(e.target.files?.[0] ?? null)}
      />

      {quickOpen && quickReplies.length > 0 && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setQuickOpen(false)} />
          <div className="absolute bottom-full left-3 mb-1 z-20 w-80 max-h-64 overflow-y-auto rounded-xl glass shadow-2xl py-1">
            {quickReplies.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => applyQuickReply(r.content)}
                className="w-full text-left px-3 py-2 hover:bg-white/[0.06] transition"
              >
                <p className="text-xs font-medium text-stone-100">{r.title}</p>
                <p className="text-[11px] text-stone-400 line-clamp-2 mt-0.5">{r.content}</p>
              </button>
            ))}
          </div>
        </>
      )}

      <div className="flex gap-2 items-end">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 h-9 w-9 rounded-lg text-stone-400 hover:bg-white/[0.06] hover:text-stone-100 flex items-center justify-center transition"
          title="Anexar arquivo"
        >
          <Paperclip className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setQuickOpen((s) => !s)}
          disabled={quickReplies.length === 0}
          className="shrink-0 h-9 px-2 rounded-lg text-stone-400 hover:bg-white/[0.06] hover:text-stone-100 flex items-center gap-1 transition disabled:opacity-40 disabled:hover:bg-transparent"
          title={
            quickReplies.length === 0
              ? "Sem respostas rápidas (crie em /respostas-rapidas)"
              : "Respostas rápidas"
          }
        >
          <Sparkles className="h-4 w-4" />
          <span className="text-xs">Rápidas</span>
        </button>

        <textarea
          ref={textareaRef}
          name="text"
          required
          rows={1}
          maxLength={4000}
          placeholder="Digite sua mensagem..."
          className="flex-1 resize-none rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-stone-100 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-brand-500/60"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 h-9 px-3 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-sm font-medium flex items-center gap-1.5 transition shadow-brand-glow"
        >
          <Send className="h-3.5 w-3.5" />
          {pending ? "..." : "Enviar"}
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </form>
  );
}
