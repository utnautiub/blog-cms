export function PatternSeparator({ className = "h-8" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`screen-line-top screen-line-bottom pattern ${className}`}
    />
  );
}
