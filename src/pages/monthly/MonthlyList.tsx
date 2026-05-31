import { useEffect, useMemo } from "react";
import { useUrlState, useUrlNumber } from "@/hooks/useUrlState";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  CalendarRange,
  CheckCircle2,
  CircleDashed,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { monthlyStatusLabels } from "@/lib/labels";
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
import { usePatientOptions } from "@/features/patients/api";
import {
  useMonthlyEvolutions,
  MONTHLY_PAGE_SIZE,
  MONTH_NAMES_PT,
} from "@/features/monthlyEvolutions/api";

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

export default function MonthlyList() {
  const navigate = useNavigate();
  const [page, setPage] = useUrlNumber("page", 1);
  const [patientId, setPatientId] = useUrlState("patient", "all");
  const [year, setYear] = useUrlState("year", String(currentYear));

  const { data: patients } = usePatientOptions();
  const { data, isLoading, isError } = useMonthlyEvolutions({
    page,
    patientId: patientId === "all" ? undefined : Number(patientId),
    year: Number(year),
  });

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((data?.total ?? 0) / MONTHLY_PAGE_SIZE)),
    [data?.total],
  );

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div>
      <PageHeader
        title="Evolução mensal"
        description="Sínteses mensais geradas automaticamente e aprovação clínica."
        actions={
          <Button asChild variant="brand">
            <Link to="/evolucao-mensal/gerar">
              <Plus className="h-4 w-4" /> Gerar nova
            </Link>
          </Button>
        }
      />

      <div className="rounded-2xl border border-border bg-card shadow-soft">
        <div className="grid gap-3 border-b border-border p-4 sm:grid-cols-[1fr_auto]">
          <Select
            value={patientId}
            onValueChange={(v) => {
              setPatientId(v);
              setPage(1);
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
          <Select
            value={year}
            onValueChange={(v) => {
              setYear(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="sm:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Período</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Profissional</TableHead>
              <TableHead>Sessões</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableSkeletonRows columns={5} />}
            {!isLoading &&
              data?.rows.map((m) => (
                <TableRow
                  key={m.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/evolucao-mensal/${m.id}`)}
                >
                  <TableCell className="font-semibold">
                    {MONTH_NAMES_PT[m.reference_month - 1]} / {m.reference_year}
                  </TableCell>
                  <TableCell>{m.patient?.name ?? "—"}</TableCell>
                  <TableCell>{m.professional?.name ?? "—"}</TableCell>
                  <TableCell className="tabular-nums text-sm">
                    {m.total_present}/{m.total_sessions}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        m.workflow_status === "assinada"
                          ? "success"
                          : m.workflow_status === "aguardando_assinatura"
                            ? "accent"
                            : m.workflow_status === "rascunho"
                              ? "muted"
                              : "warning"
                      }
                    >
                      {m.workflow_status === "assinada" ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <CircleDashed className="h-3 w-3" />
                      )}
                      {monthlyStatusLabels[m.workflow_status]}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>

        {!isLoading && isError && (
          <ListErrorBanner message="Não foi possível carregar as evoluções mensais." />
        )}
        {!isLoading && !isError && (data?.rows.length ?? 0) === 0 && (
          <ListEmptyState
            icon={CalendarRange}
            title="Nenhuma evolução mensal"
            description="Gere a primeira síntese mensal a partir dos atendimentos."
            action={
              <Button asChild variant="brand" className="mt-1">
                <Link to="/evolucao-mensal/gerar">
                  <Plus className="h-4 w-4" /> Gerar nova
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
            itemLabel="síntese"
          />
        )}
      </div>
    </div>
  );
}
