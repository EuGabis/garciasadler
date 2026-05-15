import * as React from "react";
import { cn } from "./cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-orange-500 hover:bg-brand-orange-600 text-white shadow-sm shadow-brand-orange-500/30",
  secondary:
    "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100",
  ghost:
    "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60",
  danger:
    "bg-red-600 hover:bg-red-700 text-white shadow-sm",
  outline:
    "border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-2.5 text-xs",
  md: "h-9 px-3.5 text-sm",
  lg: "h-10 px-4 text-sm",
  icon: "h-9 w-9",
};

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: never;
};

export const Button = React.forwardRef<HTMLButtonElement, Props>(function Button(
  { className, variant = "primary", size = "md", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
});
