"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Send, Paperclip, X } from "lucide-react";
import { sendMessageAction, sendMediaAction, type SendState } from "./actions";

export function MessageForm({ conversationId }: { conversationId: string }) {
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
  const [pickedFile, setPickedFile] = useState<File | null>(null);

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

  if (pickedFile) {
    const previewUrl = URL.createObjectURL(pickedFile);
    const isImage = pickedFile.type.startsWith("image/");
    return (
      <form
        ref={mediaFormRef}
        action={mediaAction}
        className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3"
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

        <div className="flex items-center gap-3 mb-2 px-2 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800">
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="" className="h-10 w-10 rounded object-cover" />
          ) : (
            <Paperclip className="h-5 w-5 text-zinc-500" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{pickedFile.name}</p>
            <p className="text-[10px] text-zinc-500">
              {(pickedFile.size / 1024).toFixed(0)} KB
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setPickedFile(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            className="text-zinc-400 hover:text-zinc-600 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-2 items-end">
          <input
            name="caption"
            placeholder="Legenda (opcional)"
            className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={pending}
            className="shrink-0 h-9 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium flex items-center gap-1.5"
          >
            <Send className="h-3.5 w-3.5" />
            {pending ? "..." : "Enviar"}
          </button>
        </div>
        {error && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{error}</p>}
      </form>
    );
  }

  return (
    <form
      ref={textFormRef}
      action={textAction}
      className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3"
    >
      <input type="hidden" name="conversationId" value={conversationId} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/zip"
        className="hidden"
        onChange={(e) => setPickedFile(e.target.files?.[0] ?? null)}
      />

      <div className="flex gap-2 items-end">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 h-9 w-9 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center transition"
          title="Anexar arquivo"
        >
          <Paperclip className="h-4 w-4" />
        </button>

        <textarea
          name="text"
          required
          rows={1}
          maxLength={4000}
          placeholder="Digite sua mensagem..."
          className="flex-1 resize-none rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
          className="shrink-0 h-9 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium flex items-center gap-1.5 transition"
        >
          <Send className="h-3.5 w-3.5" />
          {pending ? "..." : "Enviar"}
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </form>
  );
}
