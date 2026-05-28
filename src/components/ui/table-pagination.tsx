import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// Rodapé padrão das listagens paginadas — total + nav prev/next.
export function TablePagination({
  total,
  page,
  totalPages,
  onPageChange,
  itemLabel = "registro",
  itemLabelPlural,
}: {
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
  itemLabelPlural?: string;
}) {
  if (total === 0) return null;
  const plural = itemLabelPlural ?? `${itemLabel}s`;
  return (
    <div className="flex items-center justify-between border-t border-border p-4 text-sm text-muted-foreground">
      <span>
        {total} {total === 1 ? itemLabel : plural}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="tabular-nums">
          {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Próxima página"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
