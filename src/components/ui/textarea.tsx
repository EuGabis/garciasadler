import * as React from "react";
import { cn } from "./cn";

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, Props>(function Textarea(
  { className, ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-stone-100 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-brand-500/60 focus:border-brand-500/40 transition disabled:opacity-60 resize-none",
        className
      )}
      {...props}
    />
  );
});
