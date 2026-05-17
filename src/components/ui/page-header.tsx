import * as React from "react";
import { cn } from "./cn";

type Props = {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
};

export function PageHeader({ title, description, actions, className }: Props) {
  return (
    <header className={cn("mb-6 flex items-start justify-between gap-4 flex-wrap", className)}>
      <div className="min-w-0">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-stone-900 dark:text-white">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-stone-500">{description}</p>
        )}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </header>
  );
}
