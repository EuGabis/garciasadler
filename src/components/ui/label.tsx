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
        "block text-[10px] font-semibold text-stone-400 mb-2 uppercase tracking-[0.2em]",
        className
      )}
      {...props}
    />
  );
}
