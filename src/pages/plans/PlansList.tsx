import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Target,
  Pencil,
  Archive,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDebounce } from "@/hooks/useDebounce";
import { planStatusLabels } from "@/lib/labels";
import {
  useTherapeuticPlans,
  useSetPlanStatus,
  PLANS_PAGE_SIZE,
} from "@/features/therapeuticPlans/api";
import type { Enums } from "@/types/database";

const statusVariant: Record<
  Enums<"plan_status">,
  "success" | "warning" | "muted"
> = {
  ativo: "success",
  revisao: "warning",
  encerrado: "muted",
};

export default function PlansList() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const search = useDebounce(searchInput);

  const { data, isLoading, isError } = useTherapeuticPlans({ search, page });
  const setStatus = useSetPlanStatus();

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((data?.total ?? 0) / PLANS_PAGE_SIZE)),
    [data?.total],
  );

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  function onSearchChange(value: string) {
    setSearchInput(value);
    setPage(1);
  }

  async function encerrar(id: number) {
    try {
      await setStatus.mutateAsync({ id, status: "encerrado" });
      toast.success("Plano encerrado");
    } catch (e) {
      toast.error("Falha ao encerrar", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

  return (
    <div>
      <PageHeader
        title="Planos Terapêuticos (PTS)"
        description="Plano Terapêutico Singular e metas por paciente."
        actions={
          <Button asChild variant="brand">
            <Link to="/planos/novo">
              <Plus className="h-4 w-4" /> Novo plano
            </Link>
          </Button>
        }
      />

      <div className="rounded-2xl border border-border bg-card shadow-soft">
        <div className="border-b border-border p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar por título do plano..."
              className="pl-9"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plano</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Profissional</TableHead>
              <TableHead>Frequência</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!isLoading &&
              data?.rows.map((p) => (
                <TableRow
                  key={p.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/planos/${p.id}`)}
                >
                  <TableCell className="font-semibold">{p.title}</TableCell>
                  <TableCell>{p.patient?.name ?? "—"}</TableCell>
                  <TableCell>{p.professional?.name ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {p.frequency}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[p.status]}>
                      {planStatusLabels[p.status]}
                    </Badge>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Ações">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => navigate(`/planos/${p.id}`)}>
                          <Pencil /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onSelect={() => encerrar(p.id)}
                          disabled={p.status === "encerrado"}
                        >
                          <Archive /> Encerrar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>

        {!isLoading && isError && (
          <div className="p-10 text-center text-sm text-destructive">
            Não foi possível carregar os planos.
          </div>
        )}
        {!isLoading && !isError && (data?.rows.length ?? 0) === 0 && (
          <div className="flex flex-col items-center gap-3 p-16 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-secondary text-muted-foreground">
              <Target className="h-6 w-6" />
            </span>
            <p className="font-semibold">Nenhum plano encontrado</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              {search
                ? "Ajuste a busca ou crie um novo plano."
                : "Crie o primeiro Plano Terapêutico Singular."}
            </p>
            <Button asChild variant="brand" className="mt-1">
              <Link to="/planos/novo">
                <Plus className="h-4 w-4" /> Novo plano
              </Link>
            </Button>
          </div>
        )}

        {!isLoading && (data?.total ?? 0) > 0 && (
          <div className="flex items-center justify-between border-t border-border p-4 text-sm text-muted-foreground">
            <span>
              {data!.total} plano{data!.total === 1 ? "" : "s"}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
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
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
