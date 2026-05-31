import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Stethoscope,
  Pencil,
  Archive,
  ArchiveRestore,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SortableHead, type SortDir } from "@/components/ui/sortable-head";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDebounce } from "@/hooks/useDebounce";
import { useUrlState, useUrlNumber } from "@/hooks/useUrlState";
import { maskPhone } from "@/lib/masks";
import { specialtyLabels } from "@/lib/labels";
import {
  useProfessionals,
  useSetProfessionalActive,
  PROFESSIONALS_PAGE_SIZE,
  type Professional,
  type ProfessionalStatusFilter,
} from "@/features/professionals/api";

export default function ProfessionalsList() {
  const navigate = useNavigate();
  const [urlSearch, setUrlSearch] = useUrlState("q", "");
  const [page, setPage] = useUrlNumber("page", 1);
  const [sortBy, setSortBy] = useUrlState("sortBy", "name");
  const [sortDirRaw, setSortDirRaw] = useUrlState("sortDir", "asc");
  const sortDir = (sortDirRaw === "desc" ? "desc" : "asc") as SortDir;
  const [statusRaw, setStatusRaw] = useUrlState("status", "active");
  const status = (
    statusRaw === "inactive" || statusRaw === "all" ? statusRaw : "active"
  ) as ProfessionalStatusFilter;
  const [searchInput, setSearchInput] = useState(urlSearch);
  const search = useDebounce(searchInput);
  const [toToggle, setToToggle] = useState<Professional | null>(null);

  useEffect(() => {
    setUrlSearch(search);
  }, [search, setUrlSearch]);

  const { data, isLoading, isError } = useProfessionals({
    search,
    page,
    sortBy,
    sortDir,
    status,
  });
  const setActiveMutation = useSetProfessionalActive();

  function onSort(key: string) {
    if (sortBy === key) setSortDirRaw(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortBy(key);
      setSortDirRaw("asc");
    }
  }

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((data?.total ?? 0) / PROFESSIONALS_PAGE_SIZE)),
    [data?.total],
  );

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages, setPage]);

  function onSearchChange(value: string) {
    setSearchInput(value);
    setPage(1);
  }

  async function confirmToggle() {
    if (!toToggle) return;
    const nextActive = !toToggle.active;
    try {
      await setActiveMutation.mutateAsync({ id: toToggle.id, active: nextActive });
      toast.success(nextActive ? "Profissional reativado" : "Profissional inativado");
    } catch (e) {
      toast.error(nextActive ? "Falha ao reativar" : "Falha ao inativar", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setToToggle(null);
    }
  }

  const isEmpty = !isLoading && !isError && (data?.rows.length ?? 0) === 0;

  return (
    <div>
      <PageHeader
        title="Profissionais"
        description="Equipe terapêutica da clínica."
        actions={
          <Button asChild variant="brand">
            <Link to="/profissionais/novo">
              <Plus className="h-4 w-4" /> Novo profissional
            </Link>
          </Button>
        }
      />

      <div className="rounded-2xl border border-border bg-card shadow-soft">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar por nome, registro ou CPF..."
              className="pl-9"
            />
          </div>
          <div className="sm:ml-auto sm:w-44">
            <Select
              value={status}
              onValueChange={(v) => {
                setStatusRaw(v);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
                <SelectItem value="all">Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead sortKey="name" currentKey={sortBy} currentDir={sortDir} onSort={onSort}>
                Profissional
              </SortableHead>
              <SortableHead sortKey="specialty" currentKey={sortBy} currentDir={sortDir} onSort={onSort}>
                Especialidade
              </SortableHead>
              <TableHead>Registro</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableSkeletonRows columns={5} />}
            {!isLoading &&
              data?.rows.map((p) => (
                <TableRow
                  key={p.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/profissionais/${p.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{p.name}</span>
                      {!p.active && <Badge variant="muted">Inativo</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {p.email || "Sem e-mail"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="accent">{specialtyLabels[p.specialty]}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {p.council_type} {p.council_number}/{p.council_state}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {p.phone ? maskPhone(p.phone) : "—"}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Ações">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => navigate(`/profissionais/${p.id}`)}>
                          <Pencil /> Editar
                        </DropdownMenuItem>
                        {p.active ? (
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onSelect={() => setToToggle(p)}
                          >
                            <Archive /> Inativar
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onSelect={() => setToToggle(p)}>
                            <ArchiveRestore /> Reativar
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>

        {!isLoading && isError && <ListErrorBanner message="Não foi possível carregar os profissionais." />}
        {isEmpty && (
          <ListEmptyState
            icon={Stethoscope}
            title="Nenhum profissional encontrado"
            description={
              search
                ? "Ajuste a busca ou cadastre um novo profissional."
                : "Cadastre o primeiro profissional da equipe."
            }
            action={
              <Button asChild variant="brand" className="mt-1">
                <Link to="/profissionais/novo">
                  <Plus className="h-4 w-4" /> Novo profissional
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
            itemLabel="profissional"
            itemLabelPlural="profissionais"
          />
        )}
      </div>

      <AlertDialog open={!!toToggle} onOpenChange={(o) => !o && setToToggle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toToggle?.active ? "Inativar profissional?" : "Reativar profissional?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toToggle?.active
                ? `${toToggle?.name} deixará de aparecer nas listagens e seleções de novos atendimentos. Os registros históricos são preservados e a ação pode ser revertida.`
                : `${toToggle?.name} voltará a aparecer nas listagens e poderá ser selecionado em novos atendimentos.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmToggle}
              disabled={setActiveMutation.isPending}
            >
              {toToggle?.active ? "Inativar" : "Reativar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
