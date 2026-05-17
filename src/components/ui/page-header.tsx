import * as React from "react";
import { cn } from "./cn";

type Props = {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
};

export function PageHeader({ eyebrow, title, description, actions, className }: Props) {
  return (
    <header className={cn("mb-8 flex items-end justify-between gap-4 flex-wrap", className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-brand-300 mb-3">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-4xl lg:text-5xl text-white tracking-tighter leading-none">
          {title}
        </h1>
        {description && (
          <p className="mt-3 text-sm text-stone-400 max-w-2xl">{description}</p>
        )}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </header>
  );
}
