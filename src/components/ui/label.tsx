import * as React from "react";
import { cn } from "./cn";

type Props = React.LabelHTMLAttributes<HTMLLabelElement>;

/**
 * Label da Garcia Sadler: uppercase + tracking-wider em xs.
 * Assinatura visual da plataforma.
 */
export function Label({ className, ...props }: Props) {
  return (
    <label
      className={cn(
        "block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5 uppercase tracking-wider",
        className
      )}
      {...props}
    />
  );
}
