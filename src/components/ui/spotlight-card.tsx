"use client";

import * as React from "react";
import { cn } from "./cn";

type Props = React.HTMLAttributes<HTMLDivElement> & {
  glass?: boolean;
};

/**
 * Card que rastreia a posição do mouse e renderiza um spotlight
 * radial (CSS gradient) sob o conteúdo. Combinado com `.glass`
 * vira o card hero clássico do Linear/Raycast.
 */
export function SpotlightCard({ className, glass = true, children, ...props }: Props) {
  const onMouseMove = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - rect.top}px`);
  }, []);

  return (
    <div
      className={cn(
        "spotlight rounded-2xl",
        glass && "glass",
        className
      )}
      onMouseMove={onMouseMove}
      {...props}
    >
      {children}
    </div>
  );
}
