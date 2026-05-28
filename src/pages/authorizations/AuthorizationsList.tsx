import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  FileCheck2,
  Pencil,
  Ban,
  MoreHorizontal,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
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
import { authorizationStatusLabels, specialtyLabels } from "@/lib/labels";
import {
  useAuthorizations,
  useCancelAuthorization,
  AUTHORIZATIONS_PAGE_SIZE,
  type AuthorizationRow,
} from "@/features/authorizations/api";

type Effective = "ativa" | "vencida" | "esgotada" | "cancelada";

function effectiveStatus(a: AuthorizationRow): Effective {
  if (a.status === "cancelada") return "cancelada";
  if (a.used_quantity >= a.authorized_quantity) return "esgotada";
  if (differenceInCalendarDays(parseISO(a.expiration_date), new Date()) < 0)
    return "vencida";
  return "ativa";
}

const statusVariant: Record<
  Effective,
  "success" | "destructive" | "warning" | "muted"
> = {
  ativa: "success",
  vencida: "destructive",
  esgotada: "warning",
  cancelada: "muted",
};

export default function AuthorizationsList() {
  const navigate = useNavigate();
  const [urlSearch, setUrlSearch] = useUrlState("q", "");
  const [page, setPage] = useUrlNumber("page", 1);
  const [searchInput, setSearchInput] = useState(urlSearch);
  const search = useDebounce(searchInput);
  const [toCancel, setToCancel] = useState<AuthorizationRow | null>(null);

  useEffect(() => {
    setUrlSearch(search);
  }, [search, setUrlSearch]);

  const { data, isLoading, isError } = useAuthorizations({ search, page });
  const cancel = useCancelAuthorization();

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((data?.total ?? 0) / AUTHORIZATIONS_PAGE_SIZE)),
    [data?.total],
  );

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages, setPage]);

  function onSearchChange(value: string) {
    setSearchInput(value);
    setPage(1);
  }

  async function confirmCancel() {
    if (!toCancel) return;
    try {
      await cancel.mutateAsync(toCancel.id);
      toast.success("Guia cancelada");
    } catch (e) {
      toast.error("Falha ao cancelar", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setToCancel(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Guias"
        description="Autorizações e guias das operadoras."
        actions={
          <Button asChild variant="brand">
            <Link to="/guias/novo">
              <Plus className="h-4 w-4" /> Nova guia
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
              placeholder="Buscar por guia, procedimento ou código..."
              className="pl-9"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Guia / Paciente</TableHead>
              <TableHead>Procedimento</TableHead>
              <TableHead>Saldo</TableHead>
              <TableHead>Validade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableSkeletonRows columns={6} />}

            {!isLoading &&
              data?.rows.map((a) => {
                const eff = effectiveStatus(a);
                const days = differenceInCalendarDays(
                  parseISO(a.expiration_date),
                  new Date(),
                );
                const expiringSoon = eff === "ativa" && days <= 30;
                return (
                  <TableRow
                    key={a.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/guias/${a.id}`)}
                  >
                    <TableCell>
                      <div className="font-semibold">{a.guide_number}</div>
                      <div className="text-xs text-muted-foreground">
                        {a.patient?.name ?? "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{a.procedure_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {a.procedure_code} · {specialtyLabels[a.specialty]}
                      </div>
                    </TableCell>
                    <TableCell className="tabular-nums text-sm">
                      {a.used_quantity}/{a.authorized_quantity}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div>{format(parseISO(a.expiration_date), "dd/MM/yyyy")}</div>
                      {expiringSoon && (
                        <div className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-amber-600">
                          <AlertTriangle className="h-3 w-3" />
                          {days === 0 ? "vence hoje" : `vence em ${days}d`}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[eff]}>
                        {authorizationStatusLabels[eff]}
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
                          <DropdownMenuItem
                            onSelect={() => navigate(`/guias/${a.id}`)}
                          >
                            <Pencil /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onSelect={() => setToCancel(a)}
                            disabled={a.status === "cancelada"}
                          >
                            <Ban /> Cancelar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>

        {!isLoading && isError && (
          <ListErrorBanner message="Não foi possível carregar as guias." />
        )}
        {!isLoading && !isError && (data?.rows.length ?? 0) === 0 && (
          <ListEmptyState
            icon={FileCheck2}
            title="Nenhuma guia encontrada"
            description={
              search
                ? "Ajuste a busca ou cadastre uma nova guia."
                : "Cadastre a primeira autorização."
            }
            action={
              <Button asChild variant="brand" className="mt-1">
                <Link to="/guias/novo">
                  <Plus className="h-4 w-4" /> Nova guia
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
            itemLabel="guia"
          />
        )}
      </div>

      <AlertDialog open={!!toCancel} onOpenChange={(o) => !o && setToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar guia?</AlertDialogTitle>
            <AlertDialogDescription>
              A guia {toCancel?.guide_number} será marcada como cancelada e não
              poderá mais ser usada em novas evoluções.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancel} disabled={cancel.isPending}>
              Cancelar guia
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
