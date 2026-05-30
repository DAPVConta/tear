import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Users,
  Pencil,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { differenceInYears, parseISO } from "date-fns";
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
import { maskCPF, maskPhone } from "@/lib/masks";
import { paymentTypeLabels } from "@/lib/labels";
import {
  usePatients,
  useDeactivatePatient,
  PATIENTS_PAGE_SIZE,
  type Patient,
} from "@/features/patients/api";

function age(birth: string) {
  try {
    return `${differenceInYears(new Date(), parseISO(birth))} anos`;
  } catch {
    return "—";
  }
}

export default function PatientsList() {
  const navigate = useNavigate();
  const [urlSearch, setUrlSearch] = useUrlState("q", "");
  const [page, setPage] = useUrlNumber("page", 1);
  const [sortBy, setSortBy] = useUrlState("sortBy", "name");
  const [sortDirRaw, setSortDirRaw] = useUrlState("sortDir", "asc");
  const sortDir = (sortDirRaw === "desc" ? "desc" : "asc") as SortDir;
  const [searchInput, setSearchInput] = useState(urlSearch);
  const search = useDebounce(searchInput);
  const [toDelete, setToDelete] = useState<Patient | null>(null);

  useEffect(() => {
    setUrlSearch(search);
  }, [search, setUrlSearch]);

  const { data, isLoading, isError } = usePatients({
    search,
    page,
    sortBy,
    sortDir,
  });
  const deactivate = useDeactivatePatient();

  function onSort(key: string) {
    if (sortBy === key) setSortDirRaw(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortBy(key);
      setSortDirRaw("asc");
    }
  }

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((data?.total ?? 0) / PATIENTS_PAGE_SIZE)),
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
      toast.success("Paciente arquivado");
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
        title="Pacientes"
        description="Cadastro e gestão dos pacientes da clínica."
        actions={
          <Button asChild variant="brand">
            <Link to="/pacientes/novo">
              <Plus className="h-4 w-4" /> Novo paciente
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
              placeholder="Buscar por nome, responsável ou CPF..."
              className="pl-9"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead sortKey="name" currentKey={sortBy} currentDir={sortDir} onSort={onSort}>
                Paciente
              </SortableHead>
              <SortableHead sortKey="guardian_name" currentKey={sortBy} currentDir={sortDir} onSort={onSort}>
                Responsável
              </SortableHead>
              <SortableHead sortKey="payment_type" currentKey={sortBy} currentDir={sortDir} onSort={onSort}>
                Pagamento
              </SortableHead>
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
                  onClick={() => navigate(`/pacientes/${p.id}`)}
                >
                  <TableCell>
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {age(p.birth_date)}
                      {p.cpf ? ` · ${maskCPF(p.cpf)}` : ""}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>{p.guardian_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {maskPhone(p.guardian_phone)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.payment_type === "particular" ? "accent" : "muted"}>
                      {paymentTypeLabels[p.payment_type]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {p.guardian_email || "—"}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Ações">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => navigate(`/pacientes/${p.id}`)}>
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

        {!isLoading && isError && <ListErrorBanner message="Não foi possível carregar os pacientes." />}
        {isEmpty && (
          <ListEmptyState
            icon={Users}
            title="Nenhum paciente encontrado"
            description={
              search
                ? "Ajuste a busca ou cadastre um novo paciente."
                : "Cadastre o primeiro paciente da clínica."
            }
            action={
              <Button asChild variant="brand" className="mt-1">
                <Link to="/pacientes/novo">
                  <Plus className="h-4 w-4" /> Novo paciente
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
            itemLabel="paciente"
          />
        )}
      </div>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arquivar paciente?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete?.name} deixará de aparecer nas listagens. Os registros
              históricos são preservados. Esta ação pode ser revertida no banco.
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
