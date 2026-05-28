import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Target,
  Pencil,
  Archive,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import {
  TableSkeletonRows,
  ListErrorBanner,
  ListEmptyState,
} from "@/components/ui/list-states";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDebounce } from "@/hooks/useDebounce";
import { useUrlState, useUrlNumber } from "@/hooks/useUrlState";
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
  const [urlSearch, setUrlSearch] = useUrlState("q", "");
  const [page, setPage] = useUrlNumber("page", 1);
  const [searchInput, setSearchInput] = useState(urlSearch);
  const search = useDebounce(searchInput);

  useEffect(() => {
    setUrlSearch(search);
  }, [search, setUrlSearch]);

  const { data, isLoading, isError } = useTherapeuticPlans({ search, page });
  const setStatus = useSetPlanStatus();

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((data?.total ?? 0) / PLANS_PAGE_SIZE)),
    [data?.total],
  );

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages, setPage]);

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

  const isEmpty = !isLoading && !isError && (data?.rows.length ?? 0) === 0;

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
            {isLoading && <TableSkeletonRows columns={6} />}
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

        {!isLoading && isError && <ListErrorBanner message="Não foi possível carregar os planos." />}
        {isEmpty && (
          <ListEmptyState
            icon={Target}
            title="Nenhum plano encontrado"
            description={
              search
                ? "Ajuste a busca ou crie um novo plano."
                : "Crie o primeiro Plano Terapêutico Singular."
            }
            action={
              <Button asChild variant="brand" className="mt-1">
                <Link to="/planos/novo">
                  <Plus className="h-4 w-4" /> Novo plano
                </Link>
              </Button>
            }
          />
        )}
        {!isLoading && (
          <TablePagination
            total={data?.total ?? 0}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            itemLabel="plano"
          />
        )}
      </div>
    </div>
  );
}
