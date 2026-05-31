import { useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  ClipboardList,
  Pencil,
  Lock,
  CheckCircle2,
  CircleDashed,
  BadgeCheck,
} from "lucide-react";
import { format, parseISO, subDays } from "date-fns";
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
import { attendanceTypeLabels } from "@/lib/labels";
import { usePatientOptions } from "@/features/patients/api";
import { useUrlState, useUrlNumber } from "@/hooks/useUrlState";
import {
  useDailyEvolutions,
  isLocked,
  getDigitalSignature,
  EVOLUTIONS_PAGE_SIZE,
  type EvolutionRow,
} from "@/features/dailyEvolutions/api";

function statusBadge(e: EvolutionRow) {
  if (getDigitalSignature(e))
    return (
      <Badge variant="success">
        <BadgeCheck className="h-3 w-3" /> Assinada digitalmente
      </Badge>
    );
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
            <Link to="/evolucoes/novo">
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
            {isLoading && <TableSkeletonRows columns={6} />}
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
          <ListErrorBanner message="Não foi possível carregar as evoluções." />
        )}
        {!isLoading && !isError && (data?.rows.length ?? 0) === 0 && (
          <ListEmptyState
            icon={ClipboardList}
            title="Nenhuma evolução no período"
            description="Ajuste o filtro ou registre uma nova sessão."
            action={
              <Button asChild variant="brand" className="mt-1">
                <Link to="/evolucoes/novo">
                  <Plus className="h-4 w-4" /> Nova evolução
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
            itemLabel="sessão"
            itemLabelPlural="sessões"
          />
        )}
      </div>
    </div>
  );
}
