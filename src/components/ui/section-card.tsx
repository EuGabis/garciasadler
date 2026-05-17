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
        "bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden",
        className
      )}
      {...props}
    >
      {(title || description || actions) && (
        <header className="px-5 py-4 border-b border-stone-100 dark:border-stone-800 flex items-start gap-4">
          <div className="flex-1 min-w-0">
            {title && (
              <h2 className="font-semibold text-stone-900 dark:text-white text-sm">{title}</h2>
            )}
            {description && (
              <p className="text-xs text-stone-500 mt-0.5">{description}</p>
            )}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </header>
      )}
      <div className={cn(noPadding ? "" : "p-5", bodyClassName)}>{children}</div>
    </div>
  );
}
