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
        className="border-t border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-stone-900 px-3 md:px-6 py-3 md:py-3.5"
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

        <div className="flex items-center gap-3 mb-3 px-3 py-2 rounded-lg bg-stone-50 dark:bg-stone-800/60 ring-1 ring-stone-200/80 dark:ring-stone-800">
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="" className="h-10 w-10 rounded object-cover" />
          ) : (
            <div className="h-10 w-10 rounded bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
              <Paperclip className="h-4 w-4 text-stone-500" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium truncate text-stone-900 dark:text-stone-100">
              {pickedFile.name}
            </p>
            <p className="text-[11px] text-stone-500 tabular-nums">
              {(pickedFile.size / 1024).toFixed(0)} KB
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setPickedFile(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            className="p-1 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-2 items-end">
          <input
            name="caption"
            placeholder="Legenda (opcional)"
            className="flex-1 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950 px-3.5 py-2 text-[13px] text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
          />
          <button
            type="submit"
            disabled={pending}
            className="shrink-0 h-9 px-4 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-[13px] font-medium flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Send className="h-3.5 w-3.5" />
            {pending ? "..." : "Enviar"}
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
      </form>
    );
  }

  return (
    <form
      ref={textFormRef}
      action={textAction}
      className="relative border-t border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-stone-900 px-3 md:px-6 py-3 md:py-3.5"
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
          <div className="absolute bottom-full left-6 mb-2 z-20 w-80 max-h-72 overflow-y-auto rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-lg shadow-stone-900/5 dark:shadow-black/40 py-1.5">
            <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-stone-400 border-b border-stone-100 dark:border-stone-800 mb-1">
              Respostas rápidas
            </div>
            {quickReplies.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => applyQuickReply(r.content)}
                className="w-full text-left px-3 py-2 hover:bg-stone-50 dark:hover:bg-stone-800/60 transition-colors"
              >
                <p className="text-[12.5px] font-medium text-stone-900 dark:text-stone-100">
                  {r.title}
                </p>
                <p className="text-[11px] text-stone-500 line-clamp-2 mt-0.5">{r.content}</p>
              </button>
            ))}
          </div>
        </>
      )}

      <div className="flex gap-2 items-end">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 h-9 w-9 rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-700 dark:hover:text-stone-200 flex items-center justify-center transition-colors"
          title="Anexar arquivo"
        >
          <Paperclip className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setQuickOpen((s) => !s)}
          disabled={quickReplies.length === 0}
          className="shrink-0 h-9 px-2.5 rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-700 dark:hover:text-stone-200 flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
          title={
            quickReplies.length === 0
              ? "Sem respostas rápidas (crie em /respostas-rapidas)"
              : "Respostas rápidas"
          }
        >
          <Sparkles className="h-4 w-4" />
          <span className="hidden md:inline text-[12px] font-medium">Rápidas</span>
        </button>

        <textarea
          ref={textareaRef}
          name="text"
          required
          rows={1}
          maxLength={4000}
          placeholder="Digite sua mensagem…"
          className="flex-1 resize-none rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950 px-3.5 py-2 text-[13.5px] text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
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
          className="shrink-0 h-9 px-4 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-[13px] font-medium flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <Send className="h-3.5 w-3.5" />
          {pending ? "..." : "Enviar"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </form>
  );
}
