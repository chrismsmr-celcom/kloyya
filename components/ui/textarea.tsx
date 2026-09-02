import { forwardRef, TextareaHTMLAttributes } from "react";
import clsx from "clsx";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={clsx(
      "focus-ring w-full rounded-xl border border-paper-border bg-white/80 px-4 py-3 text-sm text-ink placeholder:text-ink-faint backdrop-blur-sm",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";