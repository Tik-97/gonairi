import Link from "next/link";
import { LogoIcon } from "@/components/logo-icon";
import { Wordmark } from "@/components/wordmark";
import { MountainSilhouette } from "@/components/ornaments/mountain-silhouette";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-cream px-4 py-16">
      <MountainSilhouette className="pointer-events-none absolute inset-x-0 bottom-0 h-56 w-full text-terracotta opacity-[0.08]" />
      <Link href="/login" className="relative mb-8 flex items-center gap-2.5">
        <LogoIcon className="h-14 w-14" />
        <Wordmark className="font-serif text-xl font-semibold" />
      </Link>
      <div className="relative w-full max-w-sm rounded-lg border border-border bg-card p-8 shadow-sm">
        {children}
      </div>
    </div>
  );
}
