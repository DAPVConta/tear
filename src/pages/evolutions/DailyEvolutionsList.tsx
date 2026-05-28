import { useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  ClipboardList,
  Pencil,
  ChevronLeft,
  ChevronRight,
  Lock,
  CheckCircle2,
  CircleDashed,
} from "lucide-react";
import { format, parseISO, subDays } from "date-fns";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { attendanceTypeLabels } from "@/lib/labels";
import { usePatientOptions } from "@/features/patients/api";
import { useUrlState, useUrlNumber } from "@/hooks/useUrlState";
import {
  useDailyEvolutions,
  isLocked,
  EVOLUTIONS_PAGE_SIZE,
  type EvolutionRow,
} from "@/features/dailyEvolutions/api";

function statusBadge(e: EvolutionRow) {
  if (isLocked(e))
    return (
      <Badge variant="muted">
        <Lock className="h-3 w-3" /> Bloqueada
      </Badge>
    );
  if (e.professional_signature)
    return (
      <Badge variant="success">
        <CheckCircle2 className="h-3 w-3" /> Assinada
      </Badge>
    );
  return (
    <Badge variant="warning">
      <CircleDashed className="h-3 w-3" /> Em aberto
    </Badge>
  );
}

export default function DailyEvolutionsList() {
  const navigate = useNavigate();
  const [page, setPage] = useUrlNumber("page", 1);
  const [patientId, setPatientId] = useUrlState("patient", "all");
  const [from, setFrom] = useUrlState(
    "from",
    format(subDays(new Date(), 14), "yyyy-MM-dd"),
  );
  const [to, setTo] = useUrlState("to", format(new Date(), "yyyy-MM-dd"));

  const { data: patients } = usePatientOptions();
  const { data, isLoading, isError } = useDailyEvolutions({
    page,
    patientId: patientId === "all" ? undefined : Number(patientId),
    from,
    to,
  });

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((data?.total ?? 0) / EVOLUTIONS_PAGE_SIZE)),
    [data?.total],
  );

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  function resetPage() {
    setPage(1);
  }

  return (
    <div>
      <PageHeader
        title="Evolução diária"
        description="Registro estruturado das sessões."
        actions={
          <Button asChild variant="brand">
            <Link to="/evolucoes/nova">
              <Plus className="h-4 w-4" /> Nova evolução
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
              <TableHead>Tipo</TableHead>
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
              data?.rows.map((e) => (
                <TableRow
                  key={e.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/evolucoes/${e.id}`)}
                >
                  <TableCell>
                    <div className="font-semibold">
                      {format(parseISO(e.session_date), "dd/MM/yyyy")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {e.start_time.slice(0, 5)}–{e.end_time.slice(0, 5)}
                    </div>
                  </TableCell>
                  <TableCell>{e.patient?.name ?? "—"}</TableCell>
                  <TableCell>{e.professional?.name ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {attendanceTypeLabels[e.attendance_type]}
                  </TableCell>
                  <TableCell>{statusBadge(e)}</TableCell>
                  <TableCell onClick={(ev) => ev.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Abrir"
                      onClick={() => navigate(`/evolucoes/${e.id}`)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>

        {!isLoading && isError && (
          <div className="p-10 text-center text-sm text-destructive">
            Não foi possível carregar as evoluções.
          </div>
        )}
        {!isLoading && !isError && (data?.rows.length ?? 0) === 0 && (
          <div className="flex flex-col items-center gap-3 p-16 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-secondary text-muted-foreground">
              <ClipboardList className="h-6 w-6" />
            </span>
            <p className="font-semibold">Nenhuma evolução no período</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              Ajuste o filtro ou registre uma nova sessão.
            </p>
            <Button asChild variant="brand" className="mt-1">
              <Link to="/evolucoes/nova">
                <Plus className="h-4 w-4" /> Nova evolução
              </Link>
            </Button>
          </div>
        )}

        {!isLoading && (data?.total ?? 0) > 0 && (
          <div className="flex items-center justify-between border-t border-border p-4 text-sm text-muted-foreground">
            <span>
              {data!.total} sessã{data!.total === 1 ? "o" : "es"} no período
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
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
                onClick={() => setPage(page + 1)}
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
