import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  CircleDashed,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
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
  const [page, setPage] = useState(1);
  const [patientId, setPatientId] = useState<string>("all");
  const [year, setYear] = useState<string>(String(currentYear));

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
                    {m.approved ? (
                      <Badge variant="success">
                        <CheckCircle2 className="h-3 w-3" /> Aprovada
                      </Badge>
                    ) : (
                      <Badge variant="warning">
                        <CircleDashed className="h-3 w-3" /> Em revisão
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>

        {!isLoading && isError && (
          <div className="p-10 text-center text-sm text-destructive">
            Não foi possível carregar as evoluções mensais.
          </div>
        )}
        {!isLoading && !isError && (data?.rows.length ?? 0) === 0 && (
          <div className="flex flex-col items-center gap-3 p-16 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-secondary text-muted-foreground">
              <CalendarRange className="h-6 w-6" />
            </span>
            <p className="font-semibold">Nenhuma evolução mensal</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              Gere a primeira síntese mensal a partir dos atendimentos.
            </p>
            <Button asChild variant="brand" className="mt-1">
              <Link to="/evolucao-mensal/gerar">
                <Plus className="h-4 w-4" /> Gerar nova
              </Link>
            </Button>
          </div>
        )}

        {!isLoading && (data?.total ?? 0) > 0 && (
          <div className="flex items-center justify-between border-t border-border p-4 text-sm text-muted-foreground">
            <span>
              {data!.total} sínteses
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
    </div>
  );
}
