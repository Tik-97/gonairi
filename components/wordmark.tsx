/** A single warm-gold tone for both words — this appears on both light
 *  surfaces (auth/public pages, the topbar profile chip) and the dark navy
 *  sidebar, and gold is the one accent that reads clearly on both; a
 *  two-tone split needing separate light/dark variants isn't worth the
 *  complexity here. Pass font-size/weight via className. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={className}>
      <span className="text-terracotta">Go</span>
      <span className="text-terracotta-700">Nairi</span>
    </span>
  );
}
