import { cn } from "@/lib/utils";

// Logomark TEAR: barras coloridas (diversidade) sobre fundo da marca,
// com o ponto central (pessoa no centro do cuidado).
export function LogoMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative grid place-items-center rounded-xl bg-brand-radial shadow-glow",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="h-1/2 w-1/2" aria-hidden="true">
        <rect x="5" y="5" width="14" height="3" rx="1.5" fill="#1E88FF" />
        <rect x="5" y="10.5" width="14" height="3" rx="1.5" fill="#FFC400" />
        <rect x="5" y="16" width="14" height="3" rx="1.5" fill="#FF2D2D" />
      </svg>
    </div>
  );
}

export function Wordmark({
  className,
  showTagline = false,
}: {
  className?: string;
  showTagline?: boolean;
}) {
  return (
    <div className={cn("flex flex-col leading-none", className)}>
      <span className="font-display text-xl font-extrabold tracking-tight">
        TEAR
      </span>
      {showTagline && (
        <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-current/70">
          Prontuário Inteligente
        </span>
      )}
    </div>
  );
}

export function Logo({
  className,
  markClassName,
  showTagline = false,
}: {
  className?: string;
  markClassName?: string;
  showTagline?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <LogoMark className={cn("h-10 w-10", markClassName)} />
      <Wordmark showTagline={showTagline} />
    </div>
  );
}
