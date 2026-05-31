import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Controller, useForm, useFieldArray } from "react-hook-form";
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
  Stethoscope,
  ClipboardList,
  Plus,
  Trash2,
  FileText,
  Pill,
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
import type { Json } from "@/types/database";
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
import { usePatientOptions, usePatient, useUpdatePatient } from "@/features/patients/api";
import {
  useProfessionalOptions,
  useProfessional,
  useMyProfessional,
} from "@/features/professionals/api";
import {
  useDailyEvolution,
  useCreateEvolution,
  useUpdateEvolution,
  useSignEvolution,
  useSubmitForTechnicalValidation,
  useAtSupervisors,
  useActiveAuthorizationsByPatient,
  usePlansWithGoalsByPatient,
  isLocked,
  getDigitalSignature,
  getStructuredData,
  getAddenda,
  getParentFeedback,
} from "@/features/dailyEvolutions/api";
import {
  formTypeForSpecialty,
  evolutionFormTypeLabels,
  type EvolutionFormType,
  type StructuredData,
  type AbaProgram,
} from "@/features/dailyEvolutions/formTypes";
import { SignatureDialog } from "@/pages/evolutions/SignatureDialog";
import { SupervisorSignatureDialog } from "@/pages/evolutions/SupervisorSignatureDialog";
import { AddendumSection } from "@/pages/evolutions/AddendumSection";
import { CidCombobox } from "@/components/form/CidCombobox";
import { Cid11Combobox } from "@/components/form/Cid11Combobox";
import { cid10ForCid11 } from "@/lib/cid11";

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

const schemaShape = z.object({
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
  // Formulário Aplicador ABA / AT (correção #12).
  supervisor_id: z.string().optional(),
  aba_target_behaviors: z.string().optional(),
  aba_programs: z
    .array(z.object({ program: z.string(), trials: z.string() }))
    .optional(),
  prompt_physical: z.string().optional(),
  prompt_gestural: z.string().optional(),
  prompt_verbal: z.string().optional(),
  prompt_independent: z.string().optional(),
  aba_session_analysis: z.string().optional(),
  // Formulário Área médica (correção #12).
  med_anamnesis: z.string().optional(),
  med_clinical_exam: z.string().optional(),
  med_cid11: z.string().optional(),
  med_cid10: z.string().optional(),
  med_therapeutic_conduct: z.string().optional(),
});

type FormValues = z.infer<typeof schemaShape>;

// O schema é ciente do tipo de formulário (derivado da especialidade do
// profissional), que vive fora dos valores do form — por isso o resolver lê o
// tipo atual via getter no momento da validação.
function buildSchema(getFormType: () => EvolutionFormType) {
  const min = (s: string | undefined) => (s ?? "").trim().length >= 5;
  return schemaShape
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
      (v) => !v.guardian_presence_validation || v.guardian_validation_method !== "",
      {
        message: "Informe o método de validação",
        path: ["guardian_validation_method"],
      },
    )
    .superRefine((v, ctx) => {
      if (v.attendance_type === DEVOLUTIVA) {
        if (!min(v.parent_previous))
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["parent_previous"], message: "Descreva as atividades do plano anterior" });
        if (!min(v.parent_next))
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["parent_next"], message: "Descreva as atividades do próximo plano" });
        if (!min(v.parent_home))
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["parent_home"], message: "Descreva a orientação para casa" });
        return;
      }
      const formType = getFormType();
      if (formType === "aba_at") {
        if (!v.supervisor_id)
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["supervisor_id"], message: "Selecione o supervisor responsável" });
        if (!min(v.aba_target_behaviors))
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["aba_target_behaviors"], message: "Descreva comportamentos-alvo e barreiras" });
        if (!min(v.aba_session_analysis))
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["aba_session_analysis"], message: "Descreva a análise da sessão e conduta" });
      } else if (formType === "medico") {
        if (!min(v.med_anamnesis))
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["med_anamnesis"], message: "Preencha a anamnese / evolução clínica" });
        if (!min(v.med_therapeutic_conduct))
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["med_therapeutic_conduct"], message: "Descreva a conduta terapêutica/medicamentosa" });
      } else {
        if (!min(v.session_summary))
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["session_summary"], message: "Descreva a sessão" });
        if (!min(v.next_session_plan))
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["next_session_plan"], message: "Defina o próximo passo" });
      }
    });
}

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
  supervisor_id: "",
  aba_target_behaviors: "",
  aba_programs: [{ program: "", trials: "" }],
  prompt_physical: "",
  prompt_gestural: "",
  prompt_verbal: "",
  prompt_independent: "",
  aba_session_analysis: "",
  med_anamnesis: "",
  med_clinical_exam: "",
  med_cid11: "",
  med_cid10: "",
  med_therapeutic_conduct: "",
};

// Campos estruturados do form, com valores neutros (usados no reset).
type StructuredFormSlice = Pick<
  FormValues,
  | "aba_target_behaviors"
  | "aba_programs"
  | "prompt_physical"
  | "prompt_gestural"
  | "prompt_verbal"
  | "prompt_independent"
  | "aba_session_analysis"
  | "med_anamnesis"
  | "med_clinical_exam"
  | "med_cid11"
  | "med_cid10"
  | "med_therapeutic_conduct"
>;

const emptyStructuredSlice: StructuredFormSlice = {
  aba_target_behaviors: "",
  aba_programs: [{ program: "", trials: "" }],
  prompt_physical: "",
  prompt_gestural: "",
  prompt_verbal: "",
  prompt_independent: "",
  aba_session_analysis: "",
  med_anamnesis: "",
  med_clinical_exam: "",
  med_cid11: "",
  med_cid10: "",
  med_therapeutic_conduct: "",
};

const numToStr = (n: number | null | undefined) =>
  n === null || n === undefined ? "" : String(n);
const strToNum = (s: string | undefined) => {
  const n = Number((s ?? "").replace(",", "."));
  return Number.isFinite(n) && (s ?? "").trim() !== "" ? n : null;
};

function structuredToFormValues(sd: StructuredData | null): StructuredFormSlice {
  if (!sd) return { ...emptyStructuredSlice };
  if (sd.kind === "aba_at") {
    return {
      ...emptyStructuredSlice,
      aba_target_behaviors: sd.target_behaviors ?? "",
      aba_programs:
        sd.programs?.length
          ? sd.programs.map((p) => ({ program: p.program, trials: numToStr(p.trials) }))
          : [{ program: "", trials: "" }],
      prompt_physical: numToStr(sd.prompting?.physical),
      prompt_gestural: numToStr(sd.prompting?.gestural),
      prompt_verbal: numToStr(sd.prompting?.verbal),
      prompt_independent: numToStr(sd.prompting?.independent),
      aba_session_analysis: sd.session_analysis ?? "",
    };
  }
  return {
    ...emptyStructuredSlice,
    med_anamnesis: sd.anamnesis ?? "",
    med_clinical_exam: sd.clinical_exam ?? "",
    med_cid11: sd.cid11 ?? "",
    med_cid10: sd.cid10 ?? "",
    med_therapeutic_conduct: sd.therapeutic_conduct ?? "",
  };
}

export default function DailyEvolutionForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id && id !== "novo";
  const evoId = isEdit ? Number(id) : undefined;

  const { clinic, role } = useClinic();
  const { user } = useAuth();
  const { data: patients } = usePatientOptions();
  const { data: professionals } = useProfessionalOptions();
  const { data: myProfessional } = useMyProfessional();
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
  const submitForValidation = useSubmitForTechnicalValidation(evoId ?? 0);
  const updatePatientReport = useUpdatePatient(existing?.patient_id ?? 0);
  const [sigOpen, setSigOpen] = useState(false);
  const [supSigOpen, setSupSigOpen] = useState(false);

  const locked = existing ? isLocked(existing) : false;
  const signed = existing?.professional_signature ?? false;
  const digitalSig = existing ? getDigitalSignature(existing) : null;
  const validationStatus = existing?.validation_status ?? null;
  // Pode homologar: o supervisor designado da evolução, ou um admin (stand-in).
  const canHomologate =
    isEdit &&
    !!existing &&
    validationStatus === "pendente_validacao" &&
    (role === "clinic_admin" || myProfessional?.id === existing.supervisor_id);
  const addenda = existing ? getAddenda(existing) : [];

  // Dados completos para a síntese em PDF (carregados em modo edição).
  const { data: pdfPatient } = usePatient(existing?.patient_id);
  const { data: pdfProfessional } = useProfessional(existing?.professional_id);

  async function handleExportPdf() {
    if (!existing) return;
    const { exportDailyEvolutionPDF } = await import("@/lib/pdf");
    exportDailyEvolutionPDF(
      existing,
      pdfPatient ?? null,
      pdfProfessional ?? null,
      clinic?.trade_name || clinic?.name || "Clínica",
    );
  }

  async function handleExportDevolutiva() {
    if (!existing) return;
    const { exportParentFeedbackPDF } = await import("@/lib/pdf");
    exportParentFeedbackPDF(
      existing,
      pdfPatient ?? null,
      pdfProfessional ?? null,
      clinic?.trade_name || clinic?.name || "Clínica",
    );
  }

  // Emite receita/atestado (PDF para impressão) a partir da evolução médica.
  async function handleEmitMedicalDoc(kind: "receita" | "atestado") {
    if (!existing) return;
    const { exportMedicalDocumentPDF } = await import("@/lib/pdf");
    exportMedicalDocumentPDF(
      kind,
      existing,
      pdfPatient ?? null,
      pdfProfessional ?? null,
      clinic?.trade_name || clinic?.name || "Clínica",
    );
  }

  // Emite um laudo e atualiza automaticamente a validade do laudo no cadastro
  // do paciente (emissão hoje + 1 ano), conforme a correção #12.
  async function handleEmitLaudo() {
    if (!existing?.patient_id) return;
    const today = new Date();
    const issue = today.toISOString().slice(0, 10);
    const validity = new Date(
      today.getFullYear() + 1,
      today.getMonth(),
      today.getDate(),
    )
      .toISOString()
      .slice(0, 10);
    try {
      await updatePatientReport.mutateAsync({
        report_issue_date: issue,
        report_validity_date: validity,
        report_doctor: pdfProfessional?.name ?? null,
        report_crm: pdfProfessional
          ? `${pdfProfessional.council_type}/${pdfProfessional.council_state} ${pdfProfessional.council_number}`
          : null,
      });
      const { exportMedicalDocumentPDF } = await import("@/lib/pdf");
      exportMedicalDocumentPDF(
        "laudo",
        existing,
        pdfPatient ?? null,
        pdfProfessional ?? null,
        clinic?.trade_name || clinic?.name || "Clínica",
      );
      toast.success("Laudo emitido — validade atualizada no cadastro do paciente", {
        description: `Nova validade: ${validity.split("-").reverse().join("/")}`,
      });
    } catch (e) {
      toast.error("Não foi possível emitir o laudo", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

  // AT/Aplicador ABA encerra a evolução (assinatura eletrônica simples) e a
  // envia para a fila de homologação do supervisor.
  async function onSubmitForValidation() {
    if (!evoId) return;
    try {
      await submitForValidation.mutateAsync();
      toast.success("Evolução enviada para validação do supervisor");
      navigate("/evolucoes");
    } catch (e) {
      toast.error("Falha ao enviar para validação", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

  // O tipo de formulário depende da especialidade do profissional (fora dos
  // valores do form); o resolver lê o tipo corrente via este ref.
  const formTypeRef = useRef<EvolutionFormType>("clinico");

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(buildSchema(() => formTypeRef.current)),
    defaultValues: defaults,
  });

  const { fields: abaProgramFields, append: appendProgram, remove: removeProgram } =
    useFieldArray({ control, name: "aba_programs" });

  const patientId = watch("patient_id");
  const professionalId = watch("professional_id");
  const planIdStr = watch("plan_id");
  const isPrivate = watch("is_private");
  const guardianChecked = watch("guardian_presence_validation");
  const startTime = watch("start_time");
  const endTime = watch("end_time");
  const goalsWorked = watch("goals_worked");
  const attendanceType = watch("attendance_type");
  const isDevolutiva = attendanceType === DEVOLUTIVA;

  const { data: supervisors } = useAtSupervisors();
  const { data: authorizations } = useActiveAuthorizationsByPatient(patientId);
  const { data: plans } = usePlansWithGoalsByPatient(patientId);

  // Tipo do formulário, derivado da especialidade do profissional selecionado.
  const selectedProfessional = (professionals ?? []).find(
    (p) => p.id === professionalId,
  );
  const formType: EvolutionFormType = isDevolutiva
    ? "clinico"
    : formTypeForSpecialty(selectedProfessional?.specialty);
  formTypeRef.current = formType;
  const isAt = !isDevolutiva && formType === "aba_at";
  const isMedical = !isDevolutiva && formType === "medico";
  const isClinical = !isDevolutiva && formType === "clinico";

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
        supervisor_id: existing.supervisor_id ? String(existing.supervisor_id) : "",
        ...structuredToFormValues(getStructuredData(existing)),
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

    // Campos clínicos específicos do tipo de formulário (correção #12): os
    // formulários ABA/médico alimentam structured_data e também mapeiam para as
    // colunas existentes (síntese/comportamento/próximo passo) para manter
    // relatórios mensais, PDF e blindagem funcionando sem hardcode por tela.
    let typed: {
      behavioral_notes: string | null;
      behavioral_intervention: string | null;
      session_summary: string;
      next_session_plan: string;
      structured_data: Json | null;
      supervisor_id: number | null;
    };
    if (formType === "aba_at") {
      const programs: AbaProgram[] = (values.aba_programs ?? [])
        .filter((p) => p.program.trim())
        .map((p) => ({ program: p.program.trim(), trials: strToNum(p.trials) }));
      const structured: StructuredData = {
        kind: "aba_at",
        target_behaviors: values.aba_target_behaviors ?? "",
        programs,
        prompting: {
          physical: strToNum(values.prompt_physical),
          gestural: strToNum(values.prompt_gestural),
          verbal: strToNum(values.prompt_verbal),
          independent: strToNum(values.prompt_independent),
        },
        session_analysis: values.aba_session_analysis ?? "",
      };
      typed = {
        behavioral_notes: values.aba_target_behaviors || null,
        behavioral_intervention: values.aba_session_analysis || null,
        session_summary: values.aba_session_analysis ?? "",
        next_session_plan:
          values.next_session_plan?.trim() ||
          "Continuidade dos programas de ensino aplicados.",
        structured_data: structured as unknown as Json,
        supervisor_id: values.supervisor_id ? Number(values.supervisor_id) : null,
      };
    } else if (formType === "medico") {
      const structured: StructuredData = {
        kind: "medical",
        anamnesis: values.med_anamnesis ?? "",
        clinical_exam: values.med_clinical_exam ?? "",
        cid11: values.med_cid11 ?? "",
        cid10: values.med_cid10 ?? "",
        therapeutic_conduct: values.med_therapeutic_conduct ?? "",
      };
      typed = {
        behavioral_notes: values.med_clinical_exam || null,
        behavioral_intervention: null,
        session_summary: values.med_anamnesis ?? "",
        next_session_plan: values.med_therapeutic_conduct ?? "",
        structured_data: structured as unknown as Json,
        supervisor_id: null,
      };
    } else {
      typed = {
        behavioral_notes: values.behavioral_notes || null,
        behavioral_intervention: values.behavioral_intervention || null,
        session_summary: values.session_summary ?? "",
        next_session_plan: values.next_session_plan ?? "",
        structured_data: null,
        supervisor_id: null,
      };
    }

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
          parent_feedback: null,
          ...typed,
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
          <div className="flex flex-wrap items-center gap-2">
            {!isDevolutiva && (
              <Badge variant="muted">{evolutionFormTypeLabels[formType]}</Badge>
            )}
            {validationStatus === "pendente_validacao" && (
              <Badge variant="warning">Pendente de validação técnica</Badge>
            )}
            {validationStatus === "homologada" && (
              <Badge variant="success">
                <ShieldCheck className="h-3 w-3" /> Homologada
              </Badge>
            )}
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

          {isAt && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-brand-blue-light" />
                  Aplicação ABA / AT
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-2 rounded-lg border border-brand-blue-light/30 bg-brand-blue-light/5 p-3 text-sm text-muted-foreground">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-blue-light" />
                  <span>
                    Após o encerramento, esta evolução vai para a fila de
                    homologação do supervisor responsável (validação técnica).
                  </span>
                </div>
                <Field
                  label="Supervisor responsável"
                  error={errors.supervisor_id?.message}
                >
                  <Controller
                    control={control}
                    name="supervisor_id"
                    render={({ field }) => (
                      <Select value={field.value || ""} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o supervisor (Psicologia/ABA)" />
                        </SelectTrigger>
                        <SelectContent>
                          {(supervisors ?? []).map((s) => (
                            <SelectItem key={s.id} value={String(s.id)}>
                              {s.name}
                            </SelectItem>
                          ))}
                          {supervisors?.length === 0 && (
                            <div className="p-3 text-sm text-muted-foreground">
                              Nenhum supervisor cadastrado. Marque "Supervisor de
                              AT" ou "Coordenador de Psicologia/ABA" no
                              profissional.
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
                <Field
                  label="Comportamentos-alvo e barreiras"
                  error={errors.aba_target_behaviors?.message}
                >
                  <textarea
                    {...register("aba_target_behaviors")}
                    rows={3}
                    className="flex w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Crises, recusas, estereotipias e demais comportamentos observados na sessão..."
                  />
                </Field>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-semibold">
                      Programas de ensino aplicados
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendProgram({ program: "", trials: "" })}
                    >
                      <Plus className="h-4 w-4" /> Programa
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {abaProgramFields.map((f, i) => (
                      <div key={f.id} className="flex items-start gap-2">
                        <Input
                          {...register(`aba_programs.${i}.program` as const)}
                          placeholder="Nome do programa / target"
                          className="flex-1"
                        />
                        <Input
                          {...register(`aba_programs.${i}.trials` as const)}
                          placeholder="Tentativas"
                          inputMode="numeric"
                          className="w-32"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeProgram(i)}
                          disabled={abaProgramFields.length <= 1}
                          aria-label="Remover programa"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold">
                    Nível de ajuda predominante (%)
                  </p>
                  <div className="grid gap-3 sm:grid-cols-4">
                    <Field label="Física">
                      <Input {...register("prompt_physical")} inputMode="numeric" placeholder="0" />
                    </Field>
                    <Field label="Gestual">
                      <Input {...register("prompt_gestural")} inputMode="numeric" placeholder="0" />
                    </Field>
                    <Field label="Verbal">
                      <Input {...register("prompt_verbal")} inputMode="numeric" placeholder="0" />
                    </Field>
                    <Field label="Independente">
                      <Input {...register("prompt_independent")} inputMode="numeric" placeholder="0" />
                    </Field>
                  </div>
                </div>

                <Field
                  label="Análise da sessão e conduta"
                  error={errors.aba_session_analysis?.message}
                >
                  <textarea
                    {...register("aba_session_analysis")}
                    rows={4}
                    className="flex w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Manejos comportamentais, uso de reforçadores e análise geral da sessão..."
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
              </CardContent>
            </Card>
          )}

          {isMedical && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-brand-blue-light" />
                  Evolução médica
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field
                  label="Anamnese e evolução clínica"
                  error={errors.med_anamnesis?.message}
                >
                  <textarea
                    {...register("med_anamnesis")}
                    rows={4}
                    className="flex w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Padrão de sono, apetite, relatos dos pais e eficácia das terapias vigentes..."
                  />
                </Field>
                <Field label="Exame clínico / comportamental">
                  <textarea
                    {...register("med_clinical_exam")}
                    rows={3}
                    className="flex w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Contato visual, agitação psicomotora, nível de interação no consultório..."
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Diagnóstico CID-11">
                    <Controller
                      control={control}
                      name="med_cid11"
                      render={({ field }) => (
                        <Cid11Combobox
                          value={field.value ?? ""}
                          onChange={(v) => {
                            field.onChange(v);
                            const mapped = cid10ForCid11(v);
                            if (mapped) setValue("med_cid10", mapped, { shouldDirty: true });
                          }}
                          placeholder="Selecione o CID-11"
                        />
                      )}
                    />
                  </Field>
                  <Field label="CID-10 (compatibilidade)">
                    <Controller
                      control={control}
                      name="med_cid10"
                      render={({ field }) => (
                        <CidCombobox
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          placeholder="Selecione o CID-10"
                        />
                      )}
                    />
                  </Field>
                </div>
                <Field
                  label="Conduta terapêutica e medicamentosa"
                  error={errors.med_therapeutic_conduct?.message}
                >
                  <textarea
                    {...register("med_therapeutic_conduct")}
                    rows={4}
                    className="flex w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Ajustes de dosagem, introdução/descontinuação de fármacos e prazo de retorno..."
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
                {isEdit && existing && (
                  <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                    <Button type="button" variant="outline" size="sm" onClick={() => handleEmitMedicalDoc("receita")}>
                      <Pill className="h-4 w-4" /> Emitir receita
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => handleEmitMedicalDoc("atestado")}>
                      <FileText className="h-4 w-4" /> Emitir atestado
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={handleEmitLaudo}>
                      <FileText className="h-4 w-4" /> Emitir laudo (atualiza validade)
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {isClinical && (
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
          {isEdit && existing && isAt && !signed && !locked && (
            <Button
              type="button"
              variant="accent"
              onClick={onSubmitForValidation}
              disabled={submitForValidation.isPending}
            >
              {submitForValidation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" /> Encerrar e enviar para validação
                </>
              )}
            </Button>
          )}
          {isEdit && existing && !isAt && !signed && !locked && (
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
          {canHomologate && (
            <Button
              type="button"
              variant="brand"
              onClick={() => setSupSigOpen(true)}
            >
              <BadgeCheck className="h-4 w-4" /> Homologar e assinar (supervisor)
            </Button>
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
      {isEdit && existing && (
        <SupervisorSignatureDialog
          open={supSigOpen}
          onOpenChange={setSupSigOpen}
          evolution={existing}
          onSigned={() => navigate("/evolucoes")}
        />
      )}
    </div>
  );
}
