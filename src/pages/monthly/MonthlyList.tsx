import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useUrlState, useUrlNumber } from "@/hooks/useUrlState";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  CalendarRange,
  CheckCircle2,
  CircleDashed,
  FileDown,
  Loader2,
  ShieldCheck,
  Download,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useClinic } from "@/providers/ClinicProvider";
import {
  monthlyStatusLabels,
  monthlySignatureMethodLabels,
} from "@/lib/labels";
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
import { fetchSignatureDataUrl } from "@/features/professionals/api";
import {
  useMonthlyEvolutions,
  fetchFrequencyReportData,
  canSignMonthly,
  formatMonthlyPeriod,
  MONTHLY_PAGE_SIZE,
  type MonthlyRow,
} from "@/features/monthlyEvolutions/api";
import { MonthlyBatchSignatureDialog } from "./MonthlyBatchSignatureDialog";

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

export default function MonthlyList() {
  const navigate = useNavigate();
  const { clinic } = useClinic();
  const [page, setPage] = useUrlNumber("page", 1);
  const [patientId, setPatientId] = useUrlState("patient", "all");
  const [year, setYear] = useUrlState("year", String(currentYear));
  const [freqLoadingId, setFreqLoadingId] = useState<number | null>(null);
  const [signedLoadingId, setSignedLoadingId] = useState<number | null>(null);
  const [signOpen, setSignOpen] = useState(false);

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

  const rows = data?.rows ?? [];
  const eligibleToSign = rows.filter(canSignMonthly).length;

  // Rubrica do profissional para os PDFs. Best-effort: falha no download da
  // imagem nunca impede a emissão do documento.
  async function loadRubric(m: MonthlyRow): Promise<string | null> {
    if (!m.professional?.signature_path) return null;
    return fetchSignatureDataUrl(m.professional.signature_path).catch(() => null);
  }

  async function onExportFrequency(m: MonthlyRow) {
    if (!clinic?.id) return;
    setFreqLoadingId(m.id);
    try {
      const report = await fetchFrequencyReportData(clinic.id, m);
      // Só relatório já assinado/aprovado sai com a rubrica aplicada.
      const rubric =
        m.workflow_status === "assinada" || m.approved ? await loadRubric(m) : null;
      const { exportFrequencyHistoryPDF } = await import("@/lib/pdf");
      exportFrequencyHistoryPDF(report, clinic.name ?? "Clínica", rubric);
    } catch (e) {
      toast.error("Não foi possível gerar o histórico de frequência", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setFreqLoadingId(null);
    }
  }

  // Documento assinado: o mesmo relatório em PDF, agora com a rubrica do
  // profissional e o bloco da assinatura digital (titular, emissor, hash).
  async function onDownloadSigned(m: MonthlyRow) {
    setSignedLoadingId(m.id);
    try {
      const signatureImage = await loadRubric(m);
      const { exportMonthlyEvolutionPDF } = await import("@/lib/pdf");
      exportMonthlyEvolutionPDF(m, clinic?.name ?? "Clínica", signatureImage);
    } catch (e) {
      toast.error("Não foi possível baixar o documento assinado", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setSignedLoadingId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Evolução mensal"
        description="Sínteses geradas automaticamente, aprovação clínica e assinatura."
        actions={
          <div className="flex items-center gap-2">
            {/* Assinatura em lote: um certificado, todas as linhas aprovadas.
                Fica habilitado sempre que há linhas — o diálogo mostra o
                estado de cada uma, inclusive por que alguma não pode assinar. */}
            <Button
              variant="outline"
              onClick={() => setSignOpen(true)}
              disabled={isLoading || rows.length === 0}
              title="Assinar as evoluções desta página com certificado A1"
            >
              <ShieldCheck className="h-4 w-4" /> Assinar
              {eligibleToSign > 0 ? ` (${eligibleToSign})` : ""}
            </Button>
            <Button asChild variant="brand">
              <Link to="/evolucao-mensal/gerar">
                <Plus className="h-4 w-4" /> Gerar nova
              </Link>
            </Button>
          </div>
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
              <TableHead className="text-right">Documentos</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableSkeletonRows columns={6} />}
            {!isLoading &&
              rows.map((m) => (
                <TableRow
                  key={m.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/evolucao-mensal/${m.id}`)}
                >
                  <TableCell className="font-semibold">
                    {formatMonthlyPeriod(m)}
                    {m.period_type === "periodo" && (
                      <span className="ml-2 align-middle text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        período
                      </span>
                    )}
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
                    {m.workflow_status === "assinada" && m.signature_method && (
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {monthlySignatureMethodLabels[m.signature_method]}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {m.workflow_status === "assinada" && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={signedLoadingId === m.id}
                          title="Baixar arquivo assinado (PDF)"
                          aria-label="Baixar arquivo assinado"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDownloadSigned(m);
                          }}
                        >
                          {signedLoadingId === m.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4 text-[hsl(142_70%_35%)]" />
                          )}
                          <span className="hidden sm:inline">Assinado</span>
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={freqLoadingId === m.id}
                        title="Baixar histórico de frequência (PDF)"
                        onClick={(e) => {
                          e.stopPropagation();
                          onExportFrequency(m);
                        }}
                      >
                        {freqLoadingId === m.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <FileDown className="h-4 w-4" />
                        )}
                        <span className="hidden sm:inline">Frequência</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>

        {!isLoading && isError && (
          <ListErrorBanner message="Não foi possível carregar as evoluções mensais." />
        )}
        {!isLoading && !isError && rows.length === 0 && (
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

      <MonthlyBatchSignatureDialog
        open={signOpen}
        onOpenChange={setSignOpen}
        rows={rows}
      />
    </div>
  );
}
