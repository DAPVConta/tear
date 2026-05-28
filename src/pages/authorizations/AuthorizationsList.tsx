import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  FileCheck2,
  Pencil,
  Ban,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
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
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const search = useDebounce(searchInput);
  const [toCancel, setToCancel] = useState<AuthorizationRow | null>(null);

  const { data, isLoading, isError } = useAuthorizations({ search, page });
  const cancel = useCancelAuthorization();

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((data?.total ?? 0) / AUTHORIZATIONS_PAGE_SIZE)),
    [data?.total],
  );

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

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
            <Link to="/guias/nova">
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
          <div className="p-10 text-center text-sm text-destructive">
            Não foi possível carregar as guias.
          </div>
        )}
        {!isLoading && !isError && (data?.rows.length ?? 0) === 0 && (
          <div className="flex flex-col items-center gap-3 p-16 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-secondary text-muted-foreground">
              <FileCheck2 className="h-6 w-6" />
            </span>
            <p className="font-semibold">Nenhuma guia encontrada</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              {search
                ? "Ajuste a busca ou cadastre uma nova guia."
                : "Cadastre a primeira autorização."}
            </p>
            <Button asChild variant="brand" className="mt-1">
              <Link to="/guias/nova">
                <Plus className="h-4 w-4" /> Nova guia
              </Link>
            </Button>
          </div>
        )}

        {!isLoading && (data?.total ?? 0) > 0 && (
          <div className="flex items-center justify-between border-t border-border p-4 text-sm text-muted-foreground">
            <span>
              {data!.total} guia{data!.total === 1 ? "" : "s"}
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
