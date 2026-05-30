import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Stethoscope,
  Pencil,
  Trash2,
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
  useDeactivateProfessional,
  PROFESSIONALS_PAGE_SIZE,
  type Professional,
} from "@/features/professionals/api";

export default function ProfessionalsList() {
  const navigate = useNavigate();
  const [urlSearch, setUrlSearch] = useUrlState("q", "");
  const [page, setPage] = useUrlNumber("page", 1);
  const [sortBy, setSortBy] = useUrlState("sortBy", "name");
  const [sortDirRaw, setSortDirRaw] = useUrlState("sortDir", "asc");
  const sortDir = (sortDirRaw === "desc" ? "desc" : "asc") as SortDir;
  const [searchInput, setSearchInput] = useState(urlSearch);
  const search = useDebounce(searchInput);
  const [toDelete, setToDelete] = useState<Professional | null>(null);

  useEffect(() => {
    setUrlSearch(search);
  }, [search, setUrlSearch]);

  const { data, isLoading, isError } = useProfessionals({
    search,
    page,
    sortBy,
    sortDir,
  });
  const deactivate = useDeactivateProfessional();

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

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await deactivate.mutateAsync(toDelete.id);
      toast.success("Profissional arquivado");
    } catch (e) {
      toast.error("Falha ao arquivar", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setToDelete(null);
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
        <div className="border-b border-border p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar por nome, registro ou CPF..."
              className="pl-9"
            />
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
                    <div className="font-semibold">{p.name}</div>
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
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onSelect={() => setToDelete(p)}
                        >
                          <Trash2 /> Arquivar
                        </DropdownMenuItem>
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

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arquivar profissional?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete?.name} deixará de aparecer nas listagens. Os registros
              históricos são preservados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deactivate.isPending}>
              Arquivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
