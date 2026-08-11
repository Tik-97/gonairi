/** GoNairi mark: Khor Virap monastery beneath Masis & Sis (Greater & Lesser
 *  Ararat), ringed by a thin terracotta arc — supplied as a flat static asset
 *  at /public/images/logo.png rather than inline SVG. */
export function LogoIcon({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/images/logo.png" alt="" className={`rounded-[20%] object-cover ${className ?? ""}`} />
  );
}
