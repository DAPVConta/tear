import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "@/components/ui/table";

// Helpers para os estados de listagem: skeleton de linhas, erro, vazio.

export function TableSkeletonRows({
  rows = 5,
  columns,
}: {
  rows?: number;
  columns: number;
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: columns }).map((__, j) => (
            <TableCell key={j}>
              <Skeleton className="h-5 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export function ListErrorBanner({
  message = "Não foi possível carregar os registros.",
}: {
  message?: string;
}) {
  return (
    <div className="p-10 text-center text-sm text-destructive">{message}</div>
  );
}

export function ListEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 p-16 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-xl bg-secondary text-muted-foreground">
        <Icon className="h-6 w-6" />
      </span>
      <p className="font-semibold">{title}</p>
      {description && (
        <p className="max-w-xs text-sm text-muted-foreground">{description}</p>
      )}
      {action}
    </div>
  );
}
