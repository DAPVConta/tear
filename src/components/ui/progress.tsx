import { cn } from "@/lib/utils";

// Barra de progresso simples e on-brand (metas do PTS, conformidade, etc.).
// `tone` mapeia para a paleta semântica; sem dep extra.
export function Progress({
  value,
  tone = "brand",
  className,
  "aria-label": ariaLabel,
}: {
  value: number;
  tone?: "brand" | "success" | "warning" | "destructive";
  className?: string;
  "aria-label"?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  const bar =
    tone === "success"
      ? "bg-success"
      : tone === "warning"
        ? "bg-warning"
        : tone === "destructive"
          ? "bg-destructive"
          : "bg-brand-gradient";
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full bg-muted",
        className,
      )}
    >
      <div
        className={cn("h-full rounded-full transition-all duration-500 ease-out", bar)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
