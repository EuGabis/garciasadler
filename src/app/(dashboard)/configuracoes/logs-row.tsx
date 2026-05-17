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
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-red-500/15 text-red-300 ring-1 ring-red-500/30">
        <AlertOctagon className="h-3 w-3" /> fatal
      </span>
    );
  }
  if (level === "error") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30">
        <AlertTriangle className="h-3 w-3" /> error
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-white/[0.06] text-stone-300 ring-1 ring-white/10">
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
        "px-5 py-3 transition",
        !err.acknowledged && "bg-amber-500/[0.04]"
      )}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => setOpen((s) => !s)}
          className="mt-0.5 p-1 rounded text-stone-500 hover:text-stone-200"
          title="Detalhes"
        >
          {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <LevelBadge level={err.level} />
            <code className="text-[10px] bg-white/[0.06] px-1.5 py-0.5 rounded text-stone-300 font-mono">
              {err.scope}
            </code>
            {err.errorName && <span className="text-[10px] text-stone-400">{err.errorName}</span>}
            <span className="ml-auto text-[10px] text-stone-500 uppercase tracking-wider">
              {fmtRelative(err.createdAt)}
            </span>
          </div>

          <p className="mt-1 text-sm text-stone-100 truncate">{err.message}</p>

          {open && (
            <div className="mt-3 space-y-2 text-xs">
              {(err.requestId || err.url || err.ip) && (
                <div className="flex flex-wrap gap-3 text-stone-400">
                  {err.requestId && <span>req: <code className="text-stone-200">{err.requestId}</code></span>}
                  {err.url && <span>url: <code className="text-stone-200">{err.url}</code></span>}
                  {err.ip && <span>ip: <code className="text-stone-200">{err.ip}</code></span>}
                </div>
              )}

              {!!err.context && (
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-brand-300 mb-1">
                    Context
                  </p>
                  <pre className="rounded-lg bg-white/[0.04] border border-white/10 text-stone-200 p-3 text-[11px] overflow-x-auto max-h-48 whitespace-pre-wrap">
                    {JSON.stringify(err.context, null, 2)}
                  </pre>
                </div>
              )}

              {err.stack && (
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-brand-300 mb-1">
                    Stack
                  </p>
                  <pre className="rounded-lg bg-white/[0.04] border border-white/10 text-stone-200 p-3 text-[11px] overflow-x-auto max-h-64 whitespace-pre-wrap">
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
            className="shrink-0 p-1.5 rounded text-emerald-300 hover:bg-emerald-500/15 disabled:opacity-50"
            title="Marcar como revisado"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
