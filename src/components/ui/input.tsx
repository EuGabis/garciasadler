import * as React from "react";
import { cn } from "./cn";

type Props = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, Props>(function Input(
  { className, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-stone-100 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-brand-500/60 focus:border-brand-500/40 transition disabled:opacity-60",
        className
      )}
      {...props}
    />
  );
});
