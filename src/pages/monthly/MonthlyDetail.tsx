import { useEffect } from "react";
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
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Field } from "@/components/form/Field";
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
  useApproveMonthlyEvolution,
  MONTH_NAMES_PT,
  type GoalProgress,
} from "@/features/monthlyEvolutions/api";
import { useGenerateMonthlyAnalysis } from "@/features/ai/api";
import { useClinic } from "@/providers/ClinicProvider";
import { exportMonthlyEvolutionPDF } from "@/lib/pdf";
import { specialtyLabels } from "@/lib/labels";
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
  const { clinic } = useClinic();

  const { data, isLoading } = useMonthlyEvolution(monthlyId);
  const update = useUpdateMonthlyEvolution(monthlyId);
  const approve = useApproveMonthlyEvolution();
  const generateAI = useGenerateMonthlyAnalysis();

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

  async function onApprove() {
    try {
      await approve.mutateAsync(monthlyId);
      toast.success("Síntese aprovada");
    } catch (e) {
      toast.error("Falha ao aprovar", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

  function onExport() {
    if (!data) return;
    exportMonthlyEvolutionPDF(data, clinic?.name ?? "Clínica");
  }

  async function onGenerateAI() {
    if (!data) return;
    const goalsList = Array.isArray(data.goals_progress)
      ? (data.goals_progress as unknown as GoalProgress[])
      : [];
    try {
      const text = await generateAI.mutateAsync({
        period: `${MONTH_NAMES_PT[data.reference_month - 1]} / ${data.reference_year}`,
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
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
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
  const period = `${MONTH_NAMES_PT[data.reference_month - 1]} / ${data.reference_year}`;
  const signatureSource =
    data.approved && data.approved_at ? data.approved_at : data.created_at;
  const signatureDate = format(new Date(signatureSource), "dd 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  });

  return (
    <div>
      <PageHeader
        title={`Evolução mensal — ${period}`}
        description={data.patient?.name ?? undefined}
        actions={
          <div className="flex items-center gap-2">
            {data.approved ? (
              <Badge variant="success">
                <CheckCircle2 className="h-3 w-3" /> Aprovada
              </Badge>
            ) : (
              <Badge variant="warning">
                <CircleDashed className="h-3 w-3" /> Em revisão
              </Badge>
            )}
            <Button variant="outline" onClick={() => navigate("/evolucao-mensal")}>
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Button>
          </div>
        }
      />

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
            totals={{
              sessions: data.total_sessions,
              present: data.total_present,
              absent: data.total_absent,
            }}
            summary={data.generated_summary}
            approved={data.approved}
            dateLabel={signatureDate}
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
                      <TableCell className="tabular-nums">
                        {g.current_progress}%
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
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSave)} className="space-y-4">
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
                <Field label="Plano para o próximo mês">
                  <textarea
                    {...register("next_month_plan")}
                    rows={3}
                    className="flex w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Direcionamentos para o próximo mês"
                  />
                </Field>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3">
                <Button type="button" variant="outline" onClick={onExport}>
                  <FileDown className="h-4 w-4" /> Exportar PDF
                </Button>
                {!data.approved && (
                  <Button
                    type="button"
                    variant="accent"
                    onClick={onApprove}
                    disabled={approve.isPending}
                  >
                    {approve.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4" /> Aprovar
                      </>
                    )}
                  </Button>
                )}
                <Button type="submit" variant="brand" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="h-4 w-4" /> Salvar
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

