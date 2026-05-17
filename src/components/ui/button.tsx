import * as React from "react";
import { cn } from "./cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-500 hover:bg-brand-600 text-white shadow-brand-glow",
  secondary:
    "bg-white/[0.06] hover:bg-white/[0.1] text-stone-100 border border-white/10",
  ghost:
    "text-stone-300 hover:bg-white/[0.05] hover:text-white",
  danger:
    "bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-500/30",
  outline:
    "border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-stone-100",
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
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
});
