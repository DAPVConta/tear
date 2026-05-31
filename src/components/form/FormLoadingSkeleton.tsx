import { Skeleton } from "@/components/ui/skeleton";

// Estado de carregamento padrão dos formulários em modo edição: um título e um
// cartão. Substitui o bloco repetido em todos os *Form e no MonthlyDetail.
export function FormLoadingSkeleton({
  cardClassName = "h-96 w-full rounded-2xl",
}: {
  cardClassName?: string;
}) {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-64" />
      <Skeleton className={cardClassName} />
    </div>
  );
}
