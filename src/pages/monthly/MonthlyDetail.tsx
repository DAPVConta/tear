import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  Save,
  ShieldCheck,
  FileDown,
  CheckCircle2,
  CircleDashed,
  Sparkles,
  Send,
  BadgeCheck,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  PenLine,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FormLoadingSkeleton } from "@/components/form/FormLoadingSkeleton";
import { Field } from "@/components/form/Field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useMonthlyEvolution,
  useUpdateMonthlyEvolution,
  useSubmitMonthly,
  useReviewMonthly,
  getMonthlyDigitalSignature,
  formatMonthlyPeriod,
  hasProfessionalRubric,
  type GoalProgress,
} from "@/features/monthlyEvolutions/api";
import { useGenerateMonthlyAnalysis } from "@/features/ai/api";
import {
  useMyProfessional,
  useProfessionalSignatureImage,
} from "@/features/professionals/api";
import { useClinic } from "@/providers/ClinicProvider";
import { specialtyLabels, monthlyStatusLabels } from "@/lib/labels";
import { MonthlyCertificateDialog } from "./MonthlyCertificateDialog";
import { MonthlyRubricDialog } from "./MonthlyRubricDialog";
import { ReportDocument } from "./ReportDocument";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type FormValues = {
  professional_review: string;
  conclusion: string;
  next_month_plan: string;
};

export default function MonthlyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const monthlyId = Number(id);
  const { clinic, role } = useClinic();

  const { data, isLoading } = useMonthlyEvolution(monthlyId);
  const update = useUpdateMonthlyEvolution(monthlyId);
  const submitMonthly = useSubmitMonthly(monthlyId);
  const review = useReviewMonthly(monthlyId);
  const generateAI = useGenerateMonthlyAnalysis();
  const { data: myProfessional } = useMyProfessional();
  // Rubrica digitalizada do profissional responsável (aplicada no PDF quando a
  // evolução já está assinada/aprovada).
  const { data: signatureImage } = useProfessionalSignatureImage(
    data?.professional?.signature_path,
  );
  const [certOpen, setCertOpen] = useState(false);
  const [rubricOpen, setRubricOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      professional_review: "",
      conclusion: "",
      next_month_plan: "",
    },
  });

  useEffect(() => {
    if (data) {
      reset({
        professional_review: data.professional_review ?? "",
        conclusion: data.conclusion ?? "",
        next_month_plan: data.next_month_plan ?? "",
      });
    }
  }, [data, reset]);

  async function onSave(values: FormValues) {
    try {
      await update.mutateAsync({
        professional_review: values.professional_review || null,
        conclusion: values.conclusion || null,
        next_month_plan: values.next_month_plan || null,
      });
      toast.success("Síntese atualizada");
    } catch (e) {
      toast.error("Não foi possível salvar", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

  async function onSubmitForApproval() {
    try {
      // Salva o conteúdo atual antes de enviar.
      await handleSubmit(onSave)();
      await submitMonthly.mutateAsync();
      toast.success("Enviado para aprovação do coordenador");
    } catch (e) {
      toast.error("Não foi possível enviar", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

  async function onApprove() {
    try {
      await review.mutateAsync({
        decision: "approve",
        reviewerId: myProfessional?.id ?? null,
      });
      toast.success("Aprovada — aguardando assinatura do profissional");
    } catch (e) {
      toast.error("Falha ao aprovar", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

  async function onReject() {
    if (rejectReason.trim().length < 5) {
      toast.error("Descreva os ajustes solicitados (mínimo 5 caracteres).");
      return;
    }
    try {
      await review.mutateAsync({ decision: "reject", reason: rejectReason.trim() });
      toast.success("Ajustes solicitados ao profissional");
      setRejectOpen(false);
      setRejectReason("");
    } catch (e) {
      toast.error("Falha ao recusar", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

  async function onExport() {
    if (!data) return;
    const { exportMonthlyEvolutionPDF } = await import("@/lib/pdf");
    exportMonthlyEvolutionPDF(data, clinic?.name ?? "Clínica", signatureImage ?? null);
  }

  async function onGenerateAI() {
    if (!data) return;
    const goalsList = Array.isArray(data.goals_progress)
      ? (data.goals_progress as unknown as GoalProgress[])
      : [];
    try {
      const text = await generateAI.mutateAsync({
        period: formatMonthlyPeriod(data),
        specialty: data.professional?.specialty
          ? specialtyLabels[data.professional.specialty]
          : undefined,
        totals: {
          sessions: data.total_sessions,
          present: data.total_present,
          absent: data.total_absent,
        },
        summary: data.generated_summary,
        goals: goalsList.map((g) => ({
          description: g.description,
          category: g.category,
          current_progress: g.current_progress,
          status: g.status,
        })),
      });
      setValue("professional_review", text, { shouldDirty: true });
      toast.success("Análise gerada pela IA — revise e salve");
    } catch (e) {
      toast.error("Não foi possível gerar a análise", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

  if (isLoading) {
    return <FormLoadingSkeleton />;
  }
  if (!data) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center text-sm text-muted-foreground">
        Síntese não encontrada.
      </div>
    );
  }

  const goals = Array.isArray(data.goals_progress)
    ? (data.goals_progress as unknown as GoalProgress[])
    : [];
  const period = formatMonthlyPeriod(data);
  const signatureSource =
    data.approved && data.approved_at ? data.approved_at : data.created_at;
  const signatureDate = format(new Date(signatureSource), "dd 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  });

  const wf = data.workflow_status;
  const isDraft = wf === "rascunho" || wf === "ajustes_solicitados";
  // Coordenador da especialidade do profissional desta evolução pode aprovar;
  // clinic_admin segue como supervisor geral.
  const isCoordinatorForThis =
    !!myProfessional?.coordinator_specialty &&
    myProfessional.coordinator_specialty === data.professional?.specialty;
  const canReview =
    wf === "pendente_aprovacao" &&
    (role === "clinic_admin" || isCoordinatorForThis);
  const canSign = wf === "aguardando_assinatura";
  const hasRubric = hasProfessionalRubric(data);
  const digitalSig = getMonthlyDigitalSignature(data);
  const statusVariant: "muted" | "warning" | "accent" | "success" =
    wf === "assinada"
      ? "success"
      : wf === "aguardando_assinatura"
        ? "accent"
        : wf === "ajustes_solicitados"
          ? "warning"
          : wf === "pendente_aprovacao"
            ? "warning"
            : "muted";

  return (
    <div>
      <PageHeader
        title={`${data.period_type === "periodo" ? "Evolução por período" : "Evolução mensal"} — ${period}`}
        description={data.patient?.name ?? undefined}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={statusVariant}>
              {wf === "assinada" ? (
                <BadgeCheck className="h-3 w-3" />
              ) : wf === "aguardando_assinatura" ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <CircleDashed className="h-3 w-3" />
              )}
              {monthlyStatusLabels[wf]}
            </Badge>
            <Button variant="outline" onClick={() => navigate("/evolucao-mensal")}>
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Button>
          </div>
        }
      />

      {wf === "ajustes_solicitados" && data.rejection_reason && (
        <div className="mb-6 flex items-start gap-2 rounded-xl border border-amber-300/50 bg-amber-50/60 p-4 text-sm dark:bg-amber-950/20">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold text-amber-700 dark:text-amber-400">
              Ajustes solicitados pelo coordenador
              {data.reviewer_name ? ` (${data.reviewer_name})` : ""}
            </p>
            <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
              {data.rejection_reason}
            </p>
          </div>
        </div>
      )}

      {(wf === "aguardando_assinatura" || wf === "assinada") &&
        data.reviewer_name && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground shadow-soft">
            <CheckCircle2 className="h-4 w-4 text-[hsl(142_70%_40%)]" />
            Aprovada pelo coordenador <strong>{data.reviewer_name}</strong>
            {digitalSig
              ? ` · Assinada com certificado por ${digitalSig.signer_name}`
              : data.signature_method === "digital" && data.signed_at
                ? ` · Assinatura digital de ${data.professional?.name ?? "profissional"} aplicada`
                : ""}
          </div>
        )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-3">
          <ReportDocument
            clinicName={clinic?.name ?? "Clínica"}
            patientName={data.patient?.name ?? "Paciente"}
            professionalName={data.professional?.name ?? undefined}
            professionalRole={
              data.professional?.specialty
                ? specialtyLabels[data.professional.specialty]
                : undefined
            }
            period={period}
            periodType={data.period_type}
            totals={{
              sessions: data.total_sessions,
              present: data.total_present,
              absent: data.total_absent,
            }}
            summary={data.generated_summary}
            approved={data.approved}
            dateLabel={signatureDate}
            signatureImage={
              data.signed_at || data.approved ? (signatureImage ?? null) : null
            }
          />
        </div>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Metas acompanhadas</CardTitle>
          </CardHeader>
          <CardContent>
            {goals.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Sem metas associadas no período.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Meta</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Progresso</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {goals.map((g) => (
                    <TableRow key={g.goal_id}>
                      <TableCell className="font-medium">{g.description}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {g.category}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Progress
                            value={g.current_progress}
                            tone={
                              g.current_progress >= 100
                                ? "success"
                                : g.current_progress > 0
                                  ? "brand"
                                  : "warning"
                            }
                            className="w-24"
                            aria-label={`Progresso da meta: ${g.current_progress}%`}
                          />
                          <span className="tabular-nums text-sm text-muted-foreground">
                            {g.current_progress}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {g.status.replace(/_/g, " ")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
            <CardTitle>Análise profissional</CardTitle>
            {isDraft && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onGenerateAI}
                disabled={generateAI.isPending}
              >
                {generateAI.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 text-brand-blue-light" />
                )}
                Gerar com IA
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSave)} className="space-y-4">
              <fieldset disabled={!isDraft} className="space-y-4">
              <Field label="Revisão profissional">
                <textarea
                  {...register("professional_review")}
                  rows={4}
                  className="flex w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Comentário do profissional sobre o período — ou gere um rascunho com IA"
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Conclusão">
                  <textarea
                    {...register("conclusion")}
                    rows={3}
                    className="flex w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Síntese conclusiva do período"
                  />
                </Field>
                <Field label="Plano para o próximo período">
                  <textarea
                    {...register("next_month_plan")}
                    rows={3}
                    className="flex w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Direcionamentos para o próximo período"
                  />
                </Field>
              </div>
              </fieldset>

              <div className="flex flex-wrap items-center justify-end gap-3">
                {wf === "pendente_aprovacao" && !canReview && (
                  <p className="mr-auto text-xs text-muted-foreground">
                    Aguardando aprovação do coordenador.
                  </p>
                )}
                <Button type="button" variant="outline" onClick={onExport}>
                  <FileDown className="h-4 w-4" /> Exportar PDF
                </Button>

                {isDraft && (
                  <>
                    <Button type="submit" variant="outline" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Save className="h-4 w-4" /> Salvar
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="brand"
                      onClick={onSubmitForApproval}
                      disabled={submitMonthly.isPending || isSubmitting}
                    >
                      {submitMonthly.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="h-4 w-4" /> Enviar para aprovação
                        </>
                      )}
                    </Button>
                  </>
                )}

                {canReview && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setRejectOpen(true)}
                      disabled={review.isPending}
                    >
                      <ThumbsDown className="h-4 w-4" /> Solicitar ajustes
                    </Button>
                    <Button
                      type="button"
                      variant="brand"
                      onClick={onApprove}
                      disabled={review.isPending}
                    >
                      {review.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <ThumbsUp className="h-4 w-4" /> Aprovar
                        </>
                      )}
                    </Button>
                  </>
                )}

                {canSign && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setRubricOpen(true)}
                      title={
                        hasRubric
                          ? "Aplicar a assinatura cadastrada do profissional"
                          : "O profissional não tem assinatura digitalizada no cadastro"
                      }
                      disabled={!hasRubric}
                    >
                      <PenLine className="h-4 w-4" /> Assinatura digital
                    </Button>
                    <Button
                      type="button"
                      variant="brand"
                      onClick={() => setCertOpen(true)}
                    >
                      <ShieldCheck className="h-4 w-4" /> Assinar com certificado
                    </Button>
                  </>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <MonthlyCertificateDialog
        open={certOpen}
        onOpenChange={setCertOpen}
        monthly={data}
      />

      <MonthlyRubricDialog
        open={rubricOpen}
        onOpenChange={setRubricOpen}
        monthly={data}
      />

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar ajustes</DialogTitle>
            <DialogDescription>
              Descreva o que precisa ser ajustado. O profissional poderá revisar
              e reenviar para aprovação.
            </DialogDescription>
          </DialogHeader>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
            className="flex w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Ex: revisar a conclusão e detalhar o progresso da meta X..."
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="brand"
              onClick={onReject}
              disabled={review.isPending}
            >
              {review.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Solicitar ajustes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

