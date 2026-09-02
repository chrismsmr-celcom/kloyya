import { InputHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={clsx(
        "focus-ring w-full h-10 rounded-lg border border-paper-border bg-white px-3 text-sm text-ink placeholder:text-ink-faint",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
