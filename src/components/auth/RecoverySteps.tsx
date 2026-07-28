import { cn } from "@/lib/utils";

/**
 * Elemento-assinatura do fluxo de recuperação: as barras coloridas da marca
 * TEAR (diversidade/desenvolvimento) viram o trilho das três etapas. A etapa
 * corrente ocupa mais espaço e ganha a cor da marca; as concluídas ficam
 * preenchidas em tom mais discreto; as futuras ficam neutras.
 */
const STEPS = [
  { label: "Pedir link", color: "bg-brand-blue-light" },
  { label: "Conferir e-mail", color: "bg-brand-cyan" },
  { label: "Nova senha", color: "bg-brand-yellow" },
] as const;

export type RecoveryStep = 0 | 1 | 2;

export function RecoverySteps({
  current,
  className,
}: {
  current: RecoveryStep;
  className?: string;
}) {
  return (
    <ol className={cn("mb-8 flex items-end gap-2", className)}>
      {STEPS.map((step, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li
            key={step.label}
            aria-current={active ? "step" : undefined}
            className="min-w-0 flex-1"
          >
            {/* A barra cheia marca o que já foi percorrido; a etapa futura
                aparece encurtada — o motivo de barras desiguais da marca. */}
            <span
              className={cn(
                "block h-1.5 rounded-full transition-all duration-500 motion-reduce:transition-none",
                active && `w-full ${step.color}`,
                done && "w-full bg-brand-blue-light/35",
                !active && !done && "w-2/3 bg-border",
              )}
            />
            <span
              className={cn(
                "mt-2 block truncate text-[0.625rem] font-bold uppercase leading-none tracking-[0.08em]",
                active ? "text-foreground" : "text-muted-foreground",
              )}
            >
              <span className="sr-only">Etapa {index + 1} de 3: </span>
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
