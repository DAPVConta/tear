import { scorePassword } from "@/lib/password";
import { cn } from "@/lib/utils";

// Quatro segmentos, nas cores da marca em ordem de temperatura: quanto mais
// forte a senha, mais fria e "segura" a cor. Reaproveita o motivo das barras.
const SEGMENT_COLORS = [
  "bg-brand-red",
  "bg-brand-yellow",
  "bg-brand-cyan",
  "bg-brand-blue-light",
] as const;

export function PasswordStrength({ value }: { value: string }) {
  const { score, label } = scorePassword(value);

  return (
    <div className="mt-2">
      <div className="flex gap-1.5" aria-hidden="true">
        {SEGMENT_COLORS.map((color, index) => (
          <span
            key={color}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-300 motion-reduce:transition-none",
              index < score ? color : "bg-border",
            )}
          />
        ))}
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground" aria-live="polite">
        {score === 0 ? "Força da senha" : `Força da senha: ${label}`}
      </p>
    </div>
  );
}
