/** "Go" in terracotta + "Nairi" in brick — pass font-size/weight via className. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={className}>
      <span className="text-terracotta-700">Go</span>
      <span className="text-brick">Nairi</span>
    </span>
  );
}
