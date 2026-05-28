import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Users,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { differenceInYears, parseISO } from "date-fns";
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
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const search = useDebounce(searchInput);
  const [toDelete, setToDelete] = useState<Patient | null>(null);

  const { data, isLoading, isError } = usePatients({ search, page });
  const deactivate = useDeactivatePatient();

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((data?.total ?? 0) / PATIENTS_PAGE_SIZE)),
    [data?.total],
  );

  // Evita página órfã após arquivar o último item de uma página.
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

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
              <TableHead>Paciente</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((__, j) => (
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
                    <Badge
                      variant={p.payment_type === "particular" ? "accent" : "muted"}
                    >
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
                        <DropdownMenuItem
                          onSelect={() => navigate(`/pacientes/${p.id}`)}
                        >
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

        {/* Estados vazios / erro */}
        {!isLoading && isError && (
          <div className="p-10 text-center text-sm text-destructive">
            Não foi possível carregar os pacientes.
          </div>
        )}
        {!isLoading && !isError && (data?.rows.length ?? 0) === 0 && (
          <div className="flex flex-col items-center gap-3 p-16 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-secondary text-muted-foreground">
              <Users className="h-6 w-6" />
            </span>
            <p className="font-semibold">Nenhum paciente encontrado</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              {search
                ? "Ajuste a busca ou cadastre um novo paciente."
                : "Cadastre o primeiro paciente da clínica."}
            </p>
            <Button asChild variant="brand" className="mt-1">
              <Link to="/pacientes/novo">
                <Plus className="h-4 w-4" /> Novo paciente
              </Link>
            </Button>
          </div>
        )}

        {/* Paginação */}
        {!isLoading && (data?.total ?? 0) > 0 && (
          <div className="flex items-center justify-between border-t border-border p-4 text-sm text-muted-foreground">
            <span>
              {data!.total} paciente{data!.total === 1 ? "" : "s"}
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
