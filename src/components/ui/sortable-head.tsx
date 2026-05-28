import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { TableHead } from "@/components/ui/table";

export type SortDir = "asc" | "desc";

export function SortableHead({
  sortKey,
  currentKey,
  currentDir,
  onSort,
  children,
  className,
  align = "left",
}: {
  sortKey: string;
  currentKey: string;
  currentDir: SortDir;
  onSort: (key: string) => void;
  children: React.ReactNode;
  className?: string;
  align?: "left" | "right";
}) {
  const isActive = currentKey === sortKey;
  const Icon = !isActive ? ArrowUpDown : currentDir === "asc" ? ArrowUp : ArrowDown;
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded px-1 py-0.5 -mx-1 text-inherit transition-colors hover:bg-secondary/60",
          align === "right" && "ml-auto",
          isActive && "text-foreground",
        )}
      >
        {children}
        <Icon className={cn("h-3.5 w-3.5", !isActive && "opacity-50")} />
      </button>
    </TableHead>
  );
}
