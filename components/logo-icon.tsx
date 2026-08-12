/** GoNairi mark: sunrise over Masis & Sis (Greater & Lesser Ararat) — cropped
 *  to just the icon glyph (the source artwork bundles a "GoNairi" wordmark
 *  under the mountains, which we cut so it doesn't duplicate <Wordmark />
 *  wherever the two are shown side by side). Supplied as a static SVG asset
 *  at /public/images/gonairi-logo.svg (the same file also lives at
 *  /app/icon.svg for the browser-tab favicon) rather than inlined, since
 *  it's a large multi-path illustration. The full icon+wordmark lockup is
 *  preserved at /public/images/gonairi-logo-full.svg for standalone use.
 *  The glyph is landscape (wider than tall), hence object-contain rather
 *  than object-cover — cover would crop into the outer mountain slopes. */
export function LogoIcon({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/images/gonairi-logo.svg" alt="" className={`rounded-[20%] object-contain ${className ?? ""}`} />
  );
}
