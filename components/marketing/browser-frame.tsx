import Image from "next/image";

export function BrowserFrame({
  src,
  alt,
  width,
  height,
  priority,
  className,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-terracotta/15 bg-white shadow-[0_30px_80px_rgba(24,34,51,0.18)] ${className ?? ""}`}>
      <div className="flex items-center gap-3 border-b border-terracotta/10 bg-cream-100 px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-terracotta/30" />
          <span className="h-2.5 w-2.5 rounded-full bg-terracotta/30" />
          <span className="h-2.5 w-2.5 rounded-full bg-terracotta/30" />
        </div>
        <div className="flex-1 truncate rounded-full bg-white px-3 py-1 text-center text-xs text-espresso/50">Your CRM</div>
      </div>
      <Image src={src} alt={alt} width={width} height={height} priority={priority} className="w-full h-auto" />
    </div>
  );
}
