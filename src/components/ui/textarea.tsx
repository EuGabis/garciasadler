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
        "w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-orange-500 focus:border-transparent transition disabled:opacity-60 resize-none",
        className
      )}
      {...props}
    />
  );
});
