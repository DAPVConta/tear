import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Plus,
  ClipboardList,
  Pencil,
  Lock,
  CheckCircle2,
  CircleDashed,
  BadgeCheck,
  ShieldAlert,
  FileSignature,
  RefreshCw,
  Download,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { parseDateOnly } from "@/lib/date";
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
import { attendanceTypeLabels, specialtyLabels } from "@/lib/labels";
import { usePatientOptions } from "@/features/patients/api";
import { useMyProfessional } from "@/features/professionals/api";
import { useUrlState, useUrlNumber } from "@/hooks/useUrlState";
import { useClinic } from "@/providers/ClinicProvider";
import { usePsychologyUnlock } from "@/features/dailyEvolutions/psychologyUnlock";
import { PsychologyUnlockDialog } from "@/pages/evolutions/PsychologyUnlockDialog";
import { ClickSignDialog } from "@/pages/evolutions/ClickSignDialog";
import {
  getClickSignEnvelope,
  useRefreshClickSignStatus,
  useGetSignedDocumentUrl,
} from "@/features/dailyEvolutions/clicksign";
import {
  useDailyEvolutions,
  useEvolutionsPendingValidation,
  isLocked,
  getDigitalSignature,
  EVOLUTIONS_PAGE_SIZE,
  type EvolutionRow,
} from "@/features/dailyEvolutions/api";

function ConfidentialBadge() {
  return (
    <Badge variant="warning">
      <ShieldAlert className="h-3 w-3" /> Sigiloso (Psicologia)
    </Badge>
  );
}

function statusBadge(e: EvolutionRow) {
  const clickSign = getClickSignEnvelope(e);
  if (e.validation_status === "homologada")
    return (
      <Badge variant="success">
        <BadgeCheck className="h-3 w-3" /> Homologada
      </Badge>
    );
  if (e.validation_status === "pendente_validacao")
    return (
      <Badge variant="warning">
        <CircleDashed className="h-3 w-3" /> Pendente validação
      </Badge>
    );
  if (clickSign?.status === "signed")
    return (
      <Badge variant="success">
        <BadgeCheck className="h-3 w-3" /> Assinada (ClickSign)
      </Badge>
    );
  if (getDigitalSignature(e))
    return (
      <Badge variant="success">
        <BadgeCheck className="h-3 w-3" /> Assinada digitalmente
      </Badge>
    );
  if (clickSign?.status === "pending")
    return (
      <Badge variant="warning">
        <FileSignature className="h-3 w-3" /> Aguardando ClickSign
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
  const [specialty, setSpecialty] = useUrlState("specialty", "all");
  // Default sem filtro de data: mostrar todas as evoluções da clínica
  // (paginadas) e deixar o profissional aplicar a janela quando quiser. O
  // default antigo (últimos 14 dias) escondia silenciosamente registros mais
  // antigos — origem da reclamação "erro na data" (correção #14).
  const [from, setFrom] = useUrlState("from", "");
  const [to, setTo] = useUrlState("to", "");

  const { data: patients } = usePatientOptions();
  const { data: myProfessional } = useMyProfessional();
  const { data: pending } = useEvolutionsPendingValidation(myProfessional?.id);
  const { clinic } = useClinic();
  const { unlocked: psyUnlocked } = usePsychologyUnlock(clinic?.id);
  const [psyDialogOpen, setPsyDialogOpen] = useState(false);
  const [pendingConfidentialId, setPendingConfidentialId] = useState<number | null>(null);
  const [clickSignFor, setClickSignFor] = useState<EvolutionRow | null>(null);
  const [csBusyId, setCsBusyId] = useState<number | null>(null);
  const refreshClickSign = useRefreshClickSignStatus();
  const downloadSigned = useGetSignedDocumentUrl();

  // Verifica o status da assinatura direto na lista (sem abrir o diálogo).
  async function handleVerifyClickSign(e: EvolutionRow) {
    setCsBusyId(e.id);
    try {
      const r = await refreshClickSign.mutateAsync(e.id);
      if (r.status === "signed") {
        toast.success("Evolução assinada via ClickSign", {
          description: `Assinada por ${r.signer_name}.`,
        });
      } else {
        toast.info("Ainda aguardando assinatura", {
          description: `Situação do envelope na ClickSign: ${
            r.envelope_status || "desconhecida"
          }.`,
        });
      }
    } catch (err) {
      toast.error("Falha ao verificar assinatura", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setCsBusyId(null);
    }
  }

  // Baixa o documento assinado (PDF com página de assinaturas) da ClickSign.
  async function handleDownloadSigned(e: EvolutionRow) {
    setCsBusyId(e.id);
    try {
      const url = await downloadSigned.mutateAsync(e.id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      toast.error("Falha ao baixar o documento assinado", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setCsBusyId(null);
    }
  }
  const { data, isLoading, isError } = useDailyEvolutions({
    page,
    patientId: patientId === "all" ? undefined : Number(patientId),
    specialty: specialty === "all" ? undefined : specialty,
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

  // Gate de sigilo CFP/LGPD (correção #17): linha de psicologia abre o modal
  // de reautenticação antes de navegar para o detalhe.
  function openEvolution(e: EvolutionRow) {
    if (e.is_confidential && !psyUnlocked) {
      setPendingConfidentialId(e.id);
      setPsyDialogOpen(true);
      return;
    }
    navigate(`/evolucoes/${e.id}`);
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

      {(pending?.length ?? 0) > 0 && (
        <div className="mb-4 rounded-2xl border border-warning/40 bg-warning/10 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-warning-text">
            <BadgeCheck className="h-4 w-4" />
            Aguardando sua homologação ({pending!.length})
          </div>
          <ul className="space-y-1 text-sm">
            {pending!.map((e) => (
              <li key={e.id}>
                <Link
                  to={`/evolucoes/${e.id}`}
                  className="text-brand-blue-light underline-offset-2 hover:underline"
                >
                  {format(parseDateOnly(e.session_date), "dd/MM/yyyy")} ·{" "}
                  {e.patient?.name ?? "—"} · {e.professional?.name ?? "—"}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card shadow-soft">
        <div className="grid gap-3 border-b border-border p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto]">
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
          <Select
            value={specialty}
            onValueChange={(v) => {
              setSpecialty(v);
              resetPage();
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas as especialidades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as especialidades</SelectItem>
              {Object.entries(specialtyLabels).map(([v, label]) => (
                <SelectItem key={v} value={v}>
                  {label}
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
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableSkeletonRows columns={6} />}
            {!isLoading &&
              data?.rows.map((e) => {
                const masked = e.is_confidential && !psyUnlocked;
                return (
                  <TableRow
                    key={e.id}
                    className="cursor-pointer"
                    onClick={() => openEvolution(e)}
                  >
                    <TableCell>
                      <div className="font-semibold">
                        {format(parseDateOnly(e.session_date), "dd/MM/yyyy")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {e.start_time.slice(0, 5)}–{e.end_time.slice(0, 5)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {masked ? (
                        <span className="italic text-muted-foreground">
                          Conteúdo sigiloso
                        </span>
                      ) : (
                        e.patient?.name ?? "—"
                      )}
                    </TableCell>
                    <TableCell>
                      {masked ? "—" : (e.professional?.name ?? "—")}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {attendanceTypeLabels[e.attendance_type]}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1">
                        {e.is_confidential && <ConfidentialBadge />}
                        {statusBadge(e)}
                      </div>
                    </TableCell>
                    <TableCell onClick={(ev) => ev.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {!masked &&
                          (() => {
                            const cs = getClickSignEnvelope(e);
                            const busy = csBusyId === e.id;
                            if (cs?.status === "signed") {
                              return (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label="Baixar documento assinado"
                                  title="Baixar documento assinado"
                                  disabled={busy}
                                  onClick={() => handleDownloadSigned(e)}
                                >
                                  {busy ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Download className="h-4 w-4" />
                                  )}
                                </Button>
                              );
                            }
                            if (cs?.status === "pending") {
                              return (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label="Verificar assinatura"
                                  title="Verificar assinatura"
                                  disabled={busy}
                                  onClick={() => handleVerifyClickSign(e)}
                                >
                                  {busy ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <RefreshCw className="h-4 w-4" />
                                  )}
                                </Button>
                              );
                            }
                            if (!getDigitalSignature(e)) {
                              return (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label="Assinar via ClickSign"
                                  title="Assinar via ClickSign"
                                  onClick={() => setClickSignFor(e)}
                                >
                                  <FileSignature className="h-4 w-4" />
                                </Button>
                              );
                            }
                            return null;
                          })()}
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Abrir"
                          onClick={() => openEvolution(e)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
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

      <PsychologyUnlockDialog
        open={psyDialogOpen}
        onOpenChange={(v) => {
          setPsyDialogOpen(v);
          if (!v) setPendingConfidentialId(null);
        }}
        onUnlocked={() => {
          if (pendingConfidentialId) navigate(`/evolucoes/${pendingConfidentialId}`);
        }}
      />

      <ClickSignDialog
        open={!!clickSignFor}
        onOpenChange={(v) => {
          if (!v) setClickSignFor(null);
        }}
        // Após a solicitação, o refetch da lista atualiza a linha — o diálogo
        // acompanha o registro fresco (status pendente/assinada) pelo id.
        evolution={
          clickSignFor
            ? (data?.rows.find((r) => r.id === clickSignFor.id) ?? clickSignFor)
            : null
        }
      />
    </div>
  );
}
