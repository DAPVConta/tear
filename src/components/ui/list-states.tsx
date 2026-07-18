import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "@/components/ui/table";
import { TeaBars } from "@/components/brand/Logo";

// Helpers para os estados de listagem: skeleton de linhas, erro, vazio.

// Larguras variadas por coluna — o skeleton lê como conteúdo real,
// não como blocos uniformes.
const SKELETON_WIDTHS = ["w-3/4", "w-1/2", "w-2/3", "w-2/5", "w-3/5"];

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
              <Skeleton
                className={`h-5 ${SKELETON_WIDTHS[(i + j) % SKELETON_WIDTHS.length]}`}
              />
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
    <div className="m-4 flex items-center justify-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-8">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-destructive/10 text-destructive-text">
        <AlertTriangle className="h-5 w-5" />
      </span>
      <p className="text-sm font-medium text-destructive-text">{message}</p>
    </div>
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
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-muted-foreground ring-1 ring-border">
        <Icon className="h-6 w-6" />
      </span>
      <TeaBars barClassName="h-0.5 w-3.5 opacity-60" />
      <p className="font-display font-bold">{title}</p>
      {description && (
        <p className="-mt-1 max-w-xs text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
