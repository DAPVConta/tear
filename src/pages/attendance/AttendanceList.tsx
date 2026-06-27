import { useEffect, useMemo, useState } from "react";
import { useUrlState, useUrlNumber } from "@/hooks/useUrlState";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  CalendarCheck,
  Pencil,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import { format, subDays } from "date-fns";
import { parseDateOnly } from "@/lib/date";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Badge } from "@/components/ui/badge";
import { TablePagination } from "@/components/ui/table-pagination";
import {
  TableSkeletonRows,
  ListErrorBanner,
  ListEmptyState,
} from "@/components/ui/list-states";
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
import { attendanceStatusLabels } from "@/lib/labels";
import { usePatientOptions } from "@/features/patients/api";
import {
  useAttendances,
  useDeleteAttendance,
  ATTENDANCE_PAGE_SIZE,
  type AttendanceRow,
} from "@/features/attendance/api";
import type { Enums } from "@/types/database";

const statusVariant: Record<
  Enums<"attendance_status">,
  "success" | "warning" | "destructive" | "muted"
> = {
  presente: "success",
  falta_justificada: "warning",
  falta_injustificada: "destructive",
  cancelado_clinica: "muted",
  cancelado_paciente: "muted",
};

export default function AttendanceList() {
  const navigate = useNavigate();
  const [page, setPage] = useUrlNumber("page", 1);
  const [patientId, setPatientId] = useUrlState("patient", "all");
  const [from, setFrom] = useUrlState(
    "from",
    format(subDays(new Date(), 30), "yyyy-MM-dd"),
  );
  const [to, setTo] = useUrlState("to", format(new Date(), "yyyy-MM-dd"));
  const [toDelete, setToDelete] = useState<AttendanceRow | null>(null);

  const { data: patients } = usePatientOptions();
  const { data, isLoading, isError } = useAttendances({
    page,
    patientId: patientId === "all" ? undefined : Number(patientId),
    from,
    to,
  });
  const deleteAttendance = useDeleteAttendance();

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((data?.total ?? 0) / ATTENDANCE_PAGE_SIZE)),
    [data?.total],
  );

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  function resetPage() {
    setPage(1);
  }

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await deleteAttendance.mutateAsync(toDelete.id);
      toast.success("Registro removido");
    } catch (e) {
      toast.error("Falha ao remover", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setToDelete(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Frequência"
        description="Presenças, faltas e justificativas."
        actions={
          <Button asChild variant="brand">
            <Link to="/frequencia/novo">
              <Plus className="h-4 w-4" /> Novo registro
            </Link>
          </Button>
        }
      />

      <div className="rounded-2xl border border-border bg-card shadow-soft">
        <div className="grid gap-3 border-b border-border p-4 sm:grid-cols-[1fr_auto_auto]">
          <Select
            value={patientId}
            onValueChange={(v) => {
              setPatientId(v);
              resetPage();
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos os pacientes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os pacientes</SelectItem>
              {patients?.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="sm:w-44">
            <DatePicker
              value={from}
              onChange={(v) => {
                setFrom(v);
                resetPage();
              }}
              placeholder="De"
              clearable={false}
            />
          </div>
          <div className="sm:w-44">
            <DatePicker
              value={to}
              onChange={(v) => {
                setTo(v);
                resetPage();
              }}
              placeholder="Até"
              clearable={false}
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Profissional</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Justificativa</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableSkeletonRows columns={6} />}
            {!isLoading &&
              data?.rows.map((a) => (
                <TableRow
                  key={a.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/frequencia/${a.id}`)}
                >
                  <TableCell className="font-semibold">
                    {format(parseDateOnly(a.session_date), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell>{a.patient?.name ?? "—"}</TableCell>
                  <TableCell>{a.professional?.name ?? "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant={statusVariant[a.status]}>
                        {attendanceStatusLabels[a.status]}
                      </Badge>
                      {a.billable_absence && (
                        <Badge variant="warning">Passível de cobrança</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                    {a.justification || "—"}
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
                          onSelect={() => navigate(`/frequencia/${a.id}`)}
                        >
                          <Pencil /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onSelect={() => setToDelete(a)}
                        >
                          <Trash2 /> Remover
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>

        {!isLoading && isError && (
          <ListErrorBanner message="Não foi possível carregar os registros." />
        )}
        {!isLoading && !isError && (data?.rows.length ?? 0) === 0 && (
          <ListEmptyState
            icon={CalendarCheck}
            title="Nenhum registro no período"
            description="Ajuste o filtro ou registre uma presença/falta."
            action={
              <Button asChild variant="brand" className="mt-1">
                <Link to="/frequencia/novo">
                  <Plus className="h-4 w-4" /> Novo registro
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
            itemLabel="registro"
          />
        )}
      </div>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover registro?</AlertDialogTitle>
            <AlertDialogDescription>
              O registro de frequência será excluído permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteAttendance.isPending}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
