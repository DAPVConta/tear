import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  Save,
  Lock,
  CheckCircle2,
  ShieldCheck,
  FileDown,
  BadgeCheck,
  Users,
  Printer,
  Info,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClinic } from "@/providers/ClinicProvider";
import { useAuth } from "@/providers/AuthProvider";
import { Combobox } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { TagInput } from "@/components/ui/tag-input";
import { FormLoadingSkeleton } from "@/components/form/FormLoadingSkeleton";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/form/Field";
import {
  attendanceTypeLabels,
  promptingLevelLabels,
  evolutionAssessmentLabels,
  guardianValidationMethodLabels,
} from "@/lib/labels";
import { usePatientOptions, usePatient } from "@/features/patients/api";
import {
  useProfessionalOptions,
  useProfessional,
} from "@/features/professionals/api";
import {
  useDailyEvolution,
  useCreateEvolution,
  useUpdateEvolution,
  useSignEvolution,
  useActiveAuthorizationsByPatient,
  usePlansWithGoalsByPatient,
  isLocked,
  getDigitalSignature,
  getAddenda,
  getParentFeedback,
} from "@/features/dailyEvolutions/api";
import { exportDailyEvolutionPDF, exportParentFeedbackPDF } from "@/lib/pdf";
import { SignatureDialog } from "@/pages/evolutions/SignatureDialog";
import { AddendumSection } from "@/pages/evolutions/AddendumSection";

const MIN_SESSION_MINUTES = 30;

const attendanceTypes = Object.keys(attendanceTypeLabels) as [
  keyof typeof attendanceTypeLabels,
  ...(keyof typeof attendanceTypeLabels)[],
];
const promptingLevels = Object.keys(promptingLevelLabels) as [
  keyof typeof promptingLevelLabels,
  ...(keyof typeof promptingLevelLabels)[],
];
const evolutionAssessments = Object.keys(evolutionAssessmentLabels) as [
  keyof typeof evolutionAssessmentLabels,
  ...(keyof typeof evolutionAssessmentLabels)[],
];
const guardianMethods = Object.keys(guardianValidationMethodLabels) as [
  keyof typeof guardianValidationMethodLabels,
  ...(keyof typeof guardianValidationMethodLabels)[],
];

function minutesBetween(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return 0;
  return eh * 60 + em - (sh * 60 + sm);
}

const DEVOLUTIVA = "devolutiva_pais";

const schema = z
  .object({
    patient_id: z.coerce.number({ message: "Selecione o paciente" }).int().positive(),
    professional_id: z.coerce
      .number({ message: "Selecione o profissional" })
      .int()
      .positive(),
    session_date: z.string().min(1, "Informe a data"),
    start_time: z.string().min(1, "Início obrigatório"),
    end_time: z.string().min(1, "Término obrigatório"),
    attendance_type: z.enum(attendanceTypes),
    is_private: z.boolean(),
    authorization_id: z.string(),
    plan_id: z.string(),
    goals_worked: z.array(z.number()),
    skills_worked: z.array(z.string()),
    prompting_level: z.enum(promptingLevels),
    behavioral_notes: z.string().optional(),
    behavioral_intervention: z.string().optional(),
    session_summary: z.string().optional(),
    evolution_assessment: z.enum(evolutionAssessments),
    next_session_plan: z.string().optional(),
    incidents: z.string().optional(),
    guardian_presence_validation: z.boolean(),
    guardian_validation_method: z.string(),
    // Devolutiva para os pais (linguagem acessível).
    parent_previous: z.string().optional(),
    parent_next: z.string().optional(),
    parent_home: z.string().optional(),
  })
  .refine((v) => minutesBetween(v.start_time, v.end_time) > 0, {
    message: "Término deve ser após o início",
    path: ["end_time"],
  })
  .refine(
    (v) =>
      v.attendance_type === DEVOLUTIVA ||
      minutesBetween(v.start_time, v.end_time) >= MIN_SESSION_MINUTES,
    {
      message: `Duração mínima de ${MIN_SESSION_MINUTES} minutos`,
      path: ["end_time"],
    },
  )
  .refine(
    (v) =>
      v.attendance_type === DEVOLUTIVA ||
      v.is_private ||
      v.authorization_id !== "",
    {
      message: "Selecione a guia (ou marque como sessão particular)",
      path: ["authorization_id"],
    },
  )
  .refine(
    (v) =>
      !v.guardian_presence_validation || v.guardian_validation_method !== "",
    {
      message: "Informe o método de validação",
      path: ["guardian_validation_method"],
    },
  )
  .superRefine((v, ctx) => {
    const min = (s: string | undefined) => (s ?? "").trim().length >= 5;
    if (v.attendance_type === DEVOLUTIVA) {
      if (!min(v.parent_previous))
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["parent_previous"],
          message: "Descreva as atividades do plano anterior",
        });
      if (!min(v.parent_next))
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["parent_next"],
          message: "Descreva as atividades do próximo plano",
        });
      if (!min(v.parent_home))
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["parent_home"],
          message: "Descreva a orientação para casa",
        });
    } else {
      if (!min(v.session_summary))
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["session_summary"],
          message: "Descreva a sessão",
        });
      if (!min(v.next_session_plan))
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["next_session_plan"],
          message: "Defina o próximo passo",
        });
    }
  });
type FormValues = z.infer<typeof schema>;

const defaults: FormValues = {
  patient_id: undefined as unknown as number,
  professional_id: undefined as unknown as number,
  session_date: new Date().toISOString().slice(0, 10),
  start_time: "09:00",
  end_time: "10:00",
  attendance_type: "individual_presencial",
  is_private: false,
  authorization_id: "",
  plan_id: "",
  goals_worked: [],
  skills_worked: [],
  prompting_level: "independente",
  behavioral_notes: "",
  behavioral_intervention: "",
  session_summary: "",
  evolution_assessment: "estavel",
  next_session_plan: "",
  incidents: "",
  guardian_presence_validation: false,
  guardian_validation_method: "",
  parent_previous: "",
  parent_next: "",
  parent_home: "",
};

export default function DailyEvolutionForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id && id !== "novo";
  const evoId = isEdit ? Number(id) : undefined;

  const { clinic } = useClinic();
  const { user } = useAuth();
  const { data: patients } = usePatientOptions();
  const { data: professionals } = useProfessionalOptions();
  const { data: existing, isLoading } = useDailyEvolution(evoId);
  // Rascunho contém dado clínico sensível (LGPD): isola por clínica E por
  // usuário, para que outro membro no mesmo navegador (ex.: recepção
  // compartilhada) não veja o rascunho. A limpeza no logout fica no AuthProvider.
  const draftKey =
    clinic?.id && user?.id
      ? `tear:draft:evolution:${clinic.id}:${user.id}:new`
      : null;
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null);
  const draftLoadedRef = useRef(false);

  const createEvo = useCreateEvolution();
  const updateEvo = useUpdateEvolution(evoId ?? 0);
  const signEvo = useSignEvolution();
  const [sigOpen, setSigOpen] = useState(false);

  const locked = existing ? isLocked(existing) : false;
  const signed = existing?.professional_signature ?? false;
  const digitalSig = existing ? getDigitalSignature(existing) : null;
  const addenda = existing ? getAddenda(existing) : [];

  // Dados completos para a síntese em PDF (carregados em modo edição).
  const { data: pdfPatient } = usePatient(existing?.patient_id);
  const { data: pdfProfessional } = useProfessional(existing?.professional_id);

  function handleExportPdf() {
    if (!existing) return;
    exportDailyEvolutionPDF(
      existing,
      pdfPatient ?? null,
      pdfProfessional ?? null,
      clinic?.trade_name || clinic?.name || "Clínica",
    );
  }

  function handleExportDevolutiva() {
    if (!existing) return;
    exportParentFeedbackPDF(
      existing,
      pdfPatient ?? null,
      pdfProfessional ?? null,
      clinic?.trade_name || clinic?.name || "Clínica",
    );
  }

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });

  const patientId = watch("patient_id");
  const planIdStr = watch("plan_id");
  const isPrivate = watch("is_private");
  const guardianChecked = watch("guardian_presence_validation");
  const startTime = watch("start_time");
  const endTime = watch("end_time");
  const goalsWorked = watch("goals_worked");
  const attendanceType = watch("attendance_type");
  const isDevolutiva = attendanceType === DEVOLUTIVA;

  const { data: authorizations } = useActiveAuthorizationsByPatient(patientId);
  const { data: plans } = usePlansWithGoalsByPatient(patientId);

  const selectedPlanGoals = useMemo(() => {
    const planId = planIdStr ? Number(planIdStr) : null;
    if (!planId || !plans) return [];
    return plans.find((p) => p.id === planId)?.goals ?? [];
  }, [plans, planIdStr]);

  const duration = minutesBetween(startTime, endTime);

  // Restaura rascunho (apenas em modo novo, uma vez).
  useEffect(() => {
    if (isEdit || !draftKey || draftLoadedRef.current) return;
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<FormValues>;
        reset({ ...defaults, ...parsed });
      }
    } catch {
      // ignora rascunho corrompido
    }
    draftLoadedRef.current = true;
  }, [draftKey, isEdit, reset]);

  // Auto-save (debounced) dos valores em modo novo via subscribe do RHF.
  useEffect(() => {
    if (isEdit || !draftKey) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const sub = watch((values) => {
      if (!draftLoadedRef.current) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        try {
          localStorage.setItem(draftKey, JSON.stringify(values));
          setDraftSavedAt(new Date());
        } catch {
          // localStorage indisponível
        }
      }, 800);
    });
    return () => {
      if (timer) clearTimeout(timer);
      sub.unsubscribe();
    };
  }, [watch, draftKey, isEdit]);

  useEffect(() => {
    if (existing) {
      reset({
        patient_id: existing.patient_id,
        professional_id: existing.professional_id,
        session_date: existing.session_date,
        start_time: existing.start_time.slice(0, 5),
        end_time: existing.end_time.slice(0, 5),
        attendance_type: existing.attendance_type,
        is_private: existing.is_private,
        authorization_id: existing.authorization_id
          ? String(existing.authorization_id)
          : "",
        plan_id: existing.plan_id ? String(existing.plan_id) : "",
        goals_worked: Array.isArray(existing.goals_worked)
          ? (existing.goals_worked as unknown[]).filter(
              (v): v is number => typeof v === "number",
            )
          : [],
        skills_worked: Array.isArray(existing.skills_worked)
          ? (existing.skills_worked as unknown[]).filter(
              (v): v is string => typeof v === "string",
            )
          : [],
        prompting_level: existing.prompting_level,
        behavioral_notes: existing.behavioral_notes ?? "",
        behavioral_intervention: existing.behavioral_intervention ?? "",
        session_summary: existing.session_summary,
        evolution_assessment: existing.evolution_assessment,
        next_session_plan: existing.next_session_plan,
        incidents: existing.incidents ?? "",
        guardian_presence_validation: existing.guardian_presence_validation,
        guardian_validation_method: existing.guardian_validation_method ?? "",
        parent_previous: getParentFeedback(existing)?.previous_activities ?? "",
        parent_next: getParentFeedback(existing)?.next_activities ?? "",
        parent_home: getParentFeedback(existing)?.home_guidance ?? "",
      });
    }
  }, [existing, reset]);

  async function onSubmit(values: FormValues) {
    const devolutiva = values.attendance_type === DEVOLUTIVA;
    const guardianMethod = values.guardian_presence_validation
      ? (values.guardian_validation_method as
          | "assinatura_digital"
          | "token"
          | "presencial")
      : null;

    const base = {
      patient_id: values.patient_id,
      professional_id: values.professional_id,
      session_date: values.session_date,
      start_time: values.start_time,
      end_time: values.end_time,
      session_duration_minutes: minutesBetween(values.start_time, values.end_time),
      attendance_type: values.attendance_type,
      evolution_assessment: values.evolution_assessment,
      incidents: values.incidents || null,
      guardian_presence_validation: values.guardian_presence_validation,
      guardian_validation_method: guardianMethod,
    };

    // Devolutiva: layout próprio (sem guia/metas técnicas). Os 3 campos vão
    // para parent_feedback; síntese/próximo passo recebem versões legíveis
    // para satisfazer as colunas obrigatórias e os relatórios existentes.
    const payload = devolutiva
      ? {
          ...base,
          is_private: true,
          authorization_id: null,
          plan_id: null,
          goals_worked: [],
          skills_worked: [],
          prompting_level: values.prompting_level,
          behavioral_notes: null,
          behavioral_intervention: null,
          session_summary: "Devolutiva para os pais (ver orientações domiciliares).",
          next_session_plan: values.parent_home ?? "",
          parent_feedback: {
            previous_activities: values.parent_previous ?? "",
            next_activities: values.parent_next ?? "",
            home_guidance: values.parent_home ?? "",
          },
        }
      : {
          ...base,
          is_private: values.is_private,
          authorization_id: values.is_private
            ? null
            : values.authorization_id
              ? Number(values.authorization_id)
              : null,
          plan_id: values.plan_id ? Number(values.plan_id) : null,
          goals_worked: values.goals_worked,
          skills_worked: values.skills_worked,
          prompting_level: values.prompting_level,
          behavioral_notes: values.behavioral_notes || null,
          behavioral_intervention: values.behavioral_intervention || null,
          session_summary: values.session_summary ?? "",
          next_session_plan: values.next_session_plan ?? "",
          parent_feedback: null,
        };

    try {
      if (isEdit) {
        await updateEvo.mutateAsync(payload);
        toast.success("Evolução atualizada");
      } else {
        await createEvo.mutateAsync(payload);
        toast.success("Evolução registrada");
        if (draftKey) localStorage.removeItem(draftKey);
      }
      navigate("/evolucoes");
    } catch (e) {
      toast.error("Não foi possível salvar", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

  async function onSign() {
    if (!evoId) return;
    try {
      await signEvo.mutateAsync(evoId);
      toast.success("Evolução assinada");
      navigate("/evolucoes");
    } catch (e) {
      toast.error("Falha ao assinar", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

  if (isEdit && isLoading) {
    return <FormLoadingSkeleton />;
  }

  const fieldsDisabled = locked;

  return (
    <div>
      <PageHeader
        title={isEdit ? "Editar evolução" : "Nova evolução"}
        description="Campos com * são obrigatórios para blindagem de auditoria."
        actions={
          <div className="flex items-center gap-2">
            {locked && (
              <Badge variant="muted">
                <Lock className="h-3 w-3" /> Bloqueada (&gt;24h da assinatura)
              </Badge>
            )}
            {digitalSig && (
              <Badge variant="success">
                <BadgeCheck className="h-3 w-3" /> Assinada digitalmente
              </Badge>
            )}
            {signed && !digitalSig && !locked && (
              <Badge variant="success">
                <CheckCircle2 className="h-3 w-3" /> Assinada
              </Badge>
            )}
            <Button variant="outline" onClick={() => navigate("/evolucoes")}>
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Button>
          </div>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <fieldset disabled={fieldsDisabled} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados da Sessão</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Paciente" error={errors.patient_id?.message}>
                <Controller
                  control={control}
                  name="patient_id"
                  render={({ field }) => (
                    <Combobox
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(v) => {
                        field.onChange(Number(v));
                        setValue("authorization_id", "");
                        setValue("plan_id", "");
                        setValue("goals_worked", []);
                      }}
                      options={(patients ?? []).map((p) => ({
                        value: String(p.id),
                        label: p.name,
                      }))}
                      placeholder="Selecione o paciente"
                      searchPlaceholder="Buscar paciente..."
                    />
                  )}
                />
              </Field>
              <Field label="Profissional" error={errors.professional_id?.message}>
                <Controller
                  control={control}
                  name="professional_id"
                  render={({ field }) => (
                    <Combobox
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(v) => field.onChange(Number(v))}
                      options={(professionals ?? []).map((p) => ({
                        value: String(p.id),
                        label: p.name,
                      }))}
                      placeholder="Selecione o profissional"
                      searchPlaceholder="Buscar profissional..."
                    />
                  )}
                />
              </Field>
              <Field label="Data" error={errors.session_date?.message}>
                <Controller
                  control={control}
                  name="session_date"
                  render={({ field }) => (
                    <DatePicker
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="dd/mm/aaaa"
                      clearable={false}
                    />
                  )}
                />
              </Field>
              <Field label="Tipo de atendimento" error={errors.attendance_type?.message}>
                <Controller
                  control={control}
                  name="attendance_type"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(attendanceTypeLabels).map(([v, label]) => (
                          <SelectItem key={v} value={v}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field label="Hora início" error={errors.start_time?.message}>
                <Input type="time" {...register("start_time")} />
              </Field>
              <Field label="Hora fim" error={errors.end_time?.message}>
                <Input type="time" {...register("end_time")} />
                <p className="mt-1 text-xs text-muted-foreground">
                  Duração: {duration > 0 ? `${duration} min` : "—"}
                </p>
              </Field>

              {!isDevolutiva && (
                <>
              <Field label="Sessão particular?" className="sm:col-span-2">
                <Controller
                  control={control}
                  name="is_private"
                  render={({ field }) => (
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(v) => field.onChange(Boolean(v))}
                      />
                      Sem guia de operadora (paciente particular)
                    </label>
                  )}
                />
              </Field>

              {!isPrivate && (
                <Field label="Guia/autorização" error={errors.authorization_id?.message} className="sm:col-span-2">
                  <Controller
                    control={control}
                    name="authorization_id"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a guia" />
                        </SelectTrigger>
                        <SelectContent>
                          {authorizations?.map((a) => (
                            <SelectItem key={a.id} value={String(a.id)}>
                              {a.guide_number} · {a.procedure_name} ·{" "}
                              {a.used_quantity}/{a.authorized_quantity}
                            </SelectItem>
                          ))}
                          {authorizations?.length === 0 && (
                            <div className="p-3 text-sm text-muted-foreground">
                              Sem guias ativas para este paciente.
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
              )}

              <Field label="Plano terapêutico (PTS)" className="sm:col-span-2">
                <Controller
                  control={control}
                  name="plan_id"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(v) => {
                        field.onChange(v);
                        setValue("goals_worked", []);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o plano (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {plans?.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.title}
                          </SelectItem>
                        ))}
                        {plans?.length === 0 && (
                          <div className="p-3 text-sm text-muted-foreground">
                            Sem planos ativos para este paciente.
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
                </>
              )}
            </CardContent>
          </Card>

          {isDevolutiva && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-brand-blue-light" />
                  Devolutiva para os Pais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-2 rounded-lg border border-accent/30 bg-accent/5 p-3 text-sm text-muted-foreground">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span>
                    Atenção: este documento é destinado aos familiares. Utilize
                    linguagem clara, acessível e evite termos técnicos clínicos ou
                    jurídicos complexos.
                  </span>
                </div>
                <Field
                  label="Atividades trabalhadas com a criança no plano anterior"
                  error={errors.parent_previous?.message}
                >
                  <textarea
                    {...register("parent_previous")}
                    rows={3}
                    className="flex w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="O que foi trabalhado no período anterior..."
                  />
                </Field>
                <Field
                  label="Atividades que serão trabalhadas no próximo plano"
                  error={errors.parent_next?.message}
                >
                  <textarea
                    {...register("parent_next")}
                    rows={3}
                    className="flex w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="O que será trabalhado a seguir..."
                  />
                </Field>
                <Field
                  label="Orientação para Casa: atividades que os pais devem realizar"
                  error={errors.parent_home?.message}
                >
                  <textarea
                    {...register("parent_home")}
                    rows={3}
                    className="flex w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Orientações práticas para a família realizar em casa..."
                  />
                </Field>
              </CardContent>
            </Card>
          )}

          {!isDevolutiva && (
            <>
          <Card>
            <CardHeader>
              <CardTitle>Habilidades Trabalhadas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedPlanGoals.length > 0 ? (
                <div>
                  <p className="mb-2 text-sm font-semibold">Metas trabalhadas</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {selectedPlanGoals.map((g) => {
                      const checked = goalsWorked.includes(g.id);
                      return (
                        <label
                          key={g.id}
                          className="flex cursor-pointer items-start gap-2 rounded-lg border border-border bg-background p-3 text-sm transition-colors hover:bg-secondary/50"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(v) => {
                              const next = v
                                ? [...goalsWorked, g.id]
                                : goalsWorked.filter((id) => id !== g.id);
                              setValue("goals_worked", next, {
                                shouldDirty: true,
                              });
                            }}
                          />
                          <span>
                            <span className="block font-medium">{g.description}</span>
                            <span className="text-xs text-muted-foreground">
                              {g.category}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Selecione um plano para listar as metas a marcar.
                </p>
              )}

              <Field label="Registro de habilidades e nível de suporte">
                <Controller
                  control={control}
                  name="skills_worked"
                  render={({ field }) => (
                    <TagInput
                      value={field.value ?? []}
                      onChange={field.onChange}
                      placeholder="Digite e pressione Enter para adicionar"
                    />
                  )}
                />
              </Field>

              <Field label="Nível de suporte geral da sessão" error={errors.prompting_level?.message}>
                <Controller
                  control={control}
                  name="prompting_level"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(promptingLevelLabels).map(([v, label]) => (
                          <SelectItem key={v} value={v}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Registro Comportamental</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Comportamentos barreira observados">
                <textarea
                  {...register("behavioral_notes")}
                  rows={3}
                  className="flex w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Descreva comportamentos desafiadores observados durante a sessão..."
                />
              </Field>
              <Field label="Intervenções de manejo realizadas">
                <textarea
                  {...register("behavioral_intervention")}
                  rows={3}
                  className="flex w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Descreva as intervenções comportamentais aplicadas..."
                />
              </Field>
              <Field label="Intercorrências" className="sm:col-span-2">
                <textarea
                  {...register("incidents")}
                  rows={2}
                  className="flex w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Registre intercorrências, se houver..."
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Síntese da Sessão</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Síntese/observações clínicas" error={errors.session_summary?.message} className="sm:col-span-2">
                <textarea
                  {...register("session_summary")}
                  rows={4}
                  className="flex w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Descreva detalhadamente o que foi trabalhado, respostas do paciente e observações relevantes..."
                />
              </Field>
              <Field label="Avaliação de evolução" error={errors.evolution_assessment?.message}>
                <Controller
                  control={control}
                  name="evolution_assessment"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(evolutionAssessmentLabels).map(([v, label]) => (
                          <SelectItem key={v} value={v}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field label="Plano para próxima sessão" error={errors.next_session_plan?.message}>
                <Input {...register("next_session_plan")} placeholder="Descreva a conduta e plano para a próxima sessão..." />
              </Field>
            </CardContent>
          </Card>
            </>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Validação de Presença</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Presença do responsável validada?" className="sm:col-span-2">
                <Controller
                  control={control}
                  name="guardian_presence_validation"
                  render={({ field }) => (
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(v) => field.onChange(Boolean(v))}
                      />
                      Confirmo a presença/validação do responsável pelo paciente
                    </label>
                  )}
                />
              </Field>
              {guardianChecked && (
                <Field
                  label="Método de validação"
                  error={errors.guardian_validation_method?.message}
                >
                  <Controller
                    control={control}
                    name="guardian_validation_method"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {guardianMethods.map((m) => (
                            <SelectItem key={m} value={m}>
                              {guardianValidationMethodLabels[m]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
              )}
            </CardContent>
          </Card>
        </fieldset>

        {isEdit && existing && (locked || addenda.length > 0) && (
          <AddendumSection evolution={existing} />
        )}

        <div className="flex flex-wrap items-center justify-end gap-3">
          {locked ? (
            <p className="mr-auto text-xs text-muted-foreground">
              Sessão bloqueada após 24h da assinatura. Para corrigir, use um
              adendo acima.
            </p>
          ) : (
            !isEdit &&
            draftSavedAt && (
              <p className="mr-auto text-xs text-muted-foreground">
                Rascunho salvo às{" "}
                {draftSavedAt.toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )
          )}
          <Button type="button" variant="outline" onClick={() => navigate("/evolucoes")}>
            Cancelar
          </Button>
          {isEdit && existing && !isDevolutiva && (
            <Button type="button" variant="outline" onClick={handleExportPdf}>
              <FileDown className="h-4 w-4" /> Gerar síntese em PDF
            </Button>
          )}
          {isEdit && existing && isDevolutiva && (
            <Button type="button" variant="outline" onClick={handleExportDevolutiva}>
              <Printer className="h-4 w-4" /> Imprimir Devolutiva (PDF)
            </Button>
          )}
          {isEdit && existing && !signed && !locked && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={onSign}
                disabled={signEvo.isPending}
              >
                {signEvo.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" /> Assinar (sem certificado)
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="accent"
                onClick={() => setSigOpen(true)}
              >
                <BadgeCheck className="h-4 w-4" /> Assinar com certificado digital
              </Button>
            </>
          )}
          {!locked && (
            <Button type="submit" variant="brand" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Save className="h-4 w-4" /> Salvar
                </>
              )}
            </Button>
          )}
        </div>
      </form>

      {isEdit && existing && (
        <SignatureDialog
          open={sigOpen}
          onOpenChange={setSigOpen}
          evolution={existing}
        />
      )}
    </div>
  );
}
