import * as React from "react";
import { cn } from "@/components/ui";

/**
 * Estilos compartilhados das tabs de /configuracoes.
 * Stripe-style: seções com header uppercase tracking, card branco com border sutil,
 * inputs com focus ring brand-500/40.
 */

export const INPUT_CLS =
  "w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3.5 py-2 text-[13px] text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition";

export const LABEL_CLS =
  "block text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-600 dark:text-stone-400 mb-1.5";

export const SUBLABEL_CLS = "block text-[11.5px] font-medium text-stone-500 mb-1";

export const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-[13px] font-medium shadow-sm transition-colors";

export const BTN_SECONDARY =
  "inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 text-[13px] font-medium text-stone-700 dark:text-stone-300 transition-colors";

export const BTN_GHOST =
  "inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-lg text-[13px] font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors";

export const ERROR_BOX =
  "text-[12.5px] text-red-600 dark:text-red-400 px-3 py-2 rounded-md bg-red-50 dark:bg-red-500/10 ring-1 ring-red-200/60 dark:ring-red-500/20";

export const SUCCESS_BOX =
  "text-[12.5px] text-emerald-700 dark:text-emerald-400 px-3 py-2 rounded-md bg-emerald-50 dark:bg-emerald-500/10 ring-1 ring-emerald-200/60 dark:ring-emerald-500/20";

/**
 * Section: card branco com header (title + opcional description + actions).
 */
export function Section({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
  noPadding,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  noPadding?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-stone-900",
        className
      )}
    >
      {(title || description || actions) && (
        <header className="px-5 py-4 border-b border-stone-100 dark:border-stone-800/60 flex items-start gap-4">
          <div className="flex-1 min-w-0">
            {title && (
              <h2 className="text-[14px] font-semibold tracking-tight text-stone-900 dark:text-stone-50">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-0.5 text-[12.5px] text-stone-500">{description}</p>
            )}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </header>
      )}
      <div className={cn(noPadding ? "" : "p-5", bodyClassName)}>{children}</div>
    </div>
  );
}

/**
 * StatusPill: badge colorida tipo "Configurada/Pendente/Erro".
 */
export function StatusPill({
  variant,
  children,
}: {
  variant: "success" | "warning" | "error" | "neutral";
  children: React.ReactNode;
}) {
  const cls = {
    success:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 ring-emerald-200/60 dark:ring-emerald-500/20",
    warning:
      "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 ring-amber-200/60 dark:ring-amber-500/20",
    error:
      "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 ring-red-200/60 dark:ring-red-500/20",
    neutral:
      "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 ring-stone-200/60 dark:ring-stone-700",
  }[variant];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10.5px] font-semibold uppercase tracking-wider ring-1",
        cls
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          variant === "success" && "bg-emerald-500 dark:bg-emerald-400",
          variant === "warning" && "bg-amber-500 dark:bg-amber-400",
          variant === "error" && "bg-red-500 dark:bg-red-400",
          variant === "neutral" && "bg-stone-400"
        )}
      />
      {children}
    </span>
  );
}
