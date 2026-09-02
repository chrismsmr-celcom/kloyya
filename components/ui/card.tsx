import { forwardRef, HTMLAttributes } from "react";
import clsx from "clsx";

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx(
        "rounded-2xl border border-paper-border/60 bg-white/75 backdrop-blur-xl shadow-card",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";