import { Image } from "@unpic/react";
import { cn } from "@/lib/utils";

type OpenMonetisLogoProps = {
  className?: string;
  compactOnMobile?: boolean;
  onPrimary?: boolean;
};

export function OpenMonetisLogo({
  className,
  compactOnMobile = false,
  onPrimary = false,
}: OpenMonetisLogoProps) {
  return (
    <span
      aria-label="Tríade Finance"
      className={cn("flex shrink-0 items-center gap-2", className)}
      role="img"
    >
      <Image
        alt="Tríade Finance Logo"
        className={cn(
          "h-9 w-auto shrink-0 object-contain",
          onPrimary && "brightness-0 saturate-0 dark:brightness-100 dark:saturate-100",
        )}
        height={36}
        layout="fixed"
        src="/images/triade-mark.svg"
        width={36}
      />
      <span
        className={cn(
          "font-heading text-xl font-bold tracking-tight text-foreground",
          compactOnMobile && "hidden sm:inline-block",
        )}
      >
        Tríade <span className="text-brand-strong">Finance</span>
      </span>
    </span>
  );
}

// Alias de compatibilidade para transição limpa
export const TriadeLogo = OpenMonetisLogo;
