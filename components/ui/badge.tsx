import clsx from "clsx";

type Tone = "neutral" | "accent" | "success" | "warning" | "danger";

const toneMap: Record<Tone, string> = {
  neutral: "bg-paper-sunken text-ink-soft",
  accent: "bg-accent-soft text-accent",
  success: "bg-signal-ok/10 text-signal-ok",
  warning: "bg-signal-warn/10 text-signal-warn",
  danger: "bg-red-50 text-red-600",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        toneMap[tone],
        className
      )}
    >
      {children}
    </span>
  );
}