"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertOctagon,
  AlertTriangle,
  AlertCircle,
  Check,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/components/ui";
import { acknowledgeErrorAction } from "./logs-actions";
import type { ErrorLogRow } from "@/lib/error-logs";

function LevelBadge({ level }: { level: string }) {
  if (level === "fatal") {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 ring-1 ring-red-200/60 dark:ring-red-500/20">
        <AlertOctagon className="h-3 w-3" /> fatal
      </span>
    );
  }
  if (level === "error") {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-1 ring-amber-200/60 dark:ring-amber-500/20">
        <AlertTriangle className="h-3 w-3" /> error
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-400 ring-1 ring-stone-200/60 dark:ring-stone-700">
      <AlertCircle className="h-3 w-3" /> warn
    </span>
  );
}

function fmtRelative(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const diff = Date.now() - date.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s atrás`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}min atrás`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h atrás`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d atrás`;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

export function LogRow({ err, canManage }: { err: ErrorLogRow; canManage: boolean }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [pending, start] = useTransition();

  function ack() {
    start(async () => {
      await acknowledgeErrorAction(err.id);
      router.refresh();
    });
  }

  return (
    <div
      className={cn(
        "px-5 py-3 transition-colors",
        !err.acknowledged && "bg-amber-50/40 dark:bg-amber-500/[0.03]"
      )}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => setOpen((s) => !s)}
          className="mt-0.5 p-1 rounded-md text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
          title="Detalhes"
        >
          {open ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <LevelBadge level={err.level} />
            <code className="text-[10.5px] bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded font-mono text-stone-700 dark:text-stone-300 ring-1 ring-stone-200/60 dark:ring-stone-700/60">
              {err.scope}
            </code>
            {err.errorName && (
              <span className="text-[10.5px] text-stone-500 font-medium">{err.errorName}</span>
            )}
            <span className="ml-auto text-[10.5px] text-stone-500 tabular-nums">
              {fmtRelative(err.createdAt)}
            </span>
          </div>

          <p className="mt-1.5 text-[13px] text-stone-800 dark:text-stone-200 truncate">
            {err.message}
          </p>

          {open && (
            <div className="mt-3 space-y-3 text-[11.5px]">
              {(err.requestId || err.url || err.ip) && (
                <div className="flex flex-wrap gap-3 text-stone-500">
                  {err.requestId && (
                    <span>
                      req:{" "}
                      <code className="font-mono text-stone-700 dark:text-stone-300">
                        {err.requestId}
                      </code>
                    </span>
                  )}
                  {err.url && (
                    <span className="min-w-0 max-w-full truncate">
                      url:{" "}
                      <code className="font-mono text-stone-700 dark:text-stone-300">
                        {err.url}
                      </code>
                    </span>
                  )}
                  {err.ip && (
                    <span>
                      ip:{" "}
                      <code className="font-mono text-stone-700 dark:text-stone-300">
                        {err.ip}
                      </code>
                    </span>
                  )}
                </div>
              )}

              {!!err.context && (
                <div>
                  <p className="text-[10px] uppercase tracking-[0.08em] font-semibold text-stone-500 mb-1.5">
                    Context
                  </p>
                  <pre className="rounded-md bg-stone-100 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/60 p-3 text-[11px] font-mono text-stone-700 dark:text-stone-300 overflow-x-auto max-h-48 whitespace-pre-wrap">
                    {JSON.stringify(err.context, null, 2)}
                  </pre>
                </div>
              )}

              {err.stack && (
                <div>
                  <p className="text-[10px] uppercase tracking-[0.08em] font-semibold text-stone-500 mb-1.5">
                    Stack
                  </p>
                  <pre className="rounded-md bg-stone-100 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/60 p-3 text-[11px] font-mono text-stone-700 dark:text-stone-300 overflow-x-auto max-h-64 whitespace-pre-wrap">
                    {err.stack}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {canManage && !err.acknowledged && (
          <button
            type="button"
            onClick={ack}
            disabled={pending}
            className="shrink-0 p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/15 disabled:opacity-50 transition"
            title="Marcar como revisado"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
