import * as React from "react";
import { cn } from "./cn";

type Props = React.HTMLAttributes<HTMLDivElement> & {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  bodyClassName?: string;
  noPadding?: boolean;
};

export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
  noPadding,
  ...props
}: Props) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden",
        className
      )}
      {...props}
    >
      {(title || description || actions) && (
        <header className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-start gap-4">
          <div className="flex-1 min-w-0">
            {title && (
              <h2 className="font-semibold text-slate-900 dark:text-white text-sm">{title}</h2>
            )}
            {description && (
              <p className="text-xs text-slate-500 mt-0.5">{description}</p>
            )}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </header>
      )}
      <div className={cn(noPadding ? "" : "p-5", bodyClassName)}>{children}</div>
    </div>
  );
}
