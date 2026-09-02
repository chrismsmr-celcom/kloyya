export function LoadingDots({ className }: { className?: string }) {
  return (
    <span className={className}>
      <span className="animate-pulse2 inline-block">.</span>
      <span className="animate-pulse2 inline-block [animation-delay:0.2s]">.</span>
      <span className="animate-pulse2 inline-block [animation-delay:0.4s]">.</span>
    </span>
  );
}