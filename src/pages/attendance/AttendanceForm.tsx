import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  Save,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { Field } from "@/components/form/Field";
import {
  attendanceStatusLabels,
  absenceReasonLabels,
  guardianAckMethodLabels,
} from "@/lib/labels";
import { usePatientOptions } from "@/features/patients/api";
import { useProfessionalOptions } from "@/features/professionals/api";
import { useActiveAuthorizationsByPatient } from "@/features/dailyEvolutions/api";
import {
  useAttendance,
  useCreateAttendance,
  useUpdateAttendance,
  useUploadAttendanceAttachment,
  useAttendanceAttachmentUrl,
} from "@/features/attendance/api";

const statuses = Object.keys(attendanceStatusLabels) as [
  keyof typeof attendanceStatusLabels,
  ...(keyof typeof attendanceStatusLabels)[],
];

const ABSENCE_STATUSES = ["falta_justificada", "falta_injustificada"];

const schema = z
  .object({
    patient_id: z.coerce.number({ message: "Selecione o paciente" }).int().positive(),
    professional_id: z.coerce
      .number({ message: "Selecione o profissional" })
      .int()
      .positive(),
    session_date: z.string().min(1, "Informe a data"),
    status: z.enum(statuses),
    justification: z.string().optional(),
    absence_reason: z.string().optional(),
    notified_in_time: z.string().optional(), // "" | "sim" | "nao"
    is_private: z.boolean(),
    authorization_id: z.string(),
    guardian_signature: z.boolean(),
    guardian_ack_method: z.string().optional(),
  })
  .refine(
    (v) =>
      v.status === "presente" ||
      v.status === "falta_injustificada" ||
      (v.justification && v.justification.trim().length >= 3),
    {
      message: "Informe a justificativa",
      path: ["justification"],
    },
  )
  .superRefine((v, ctx) => {
    if (ABSENCE_STATUSES.includes(v.status)) {
      if (!v.absence_reason)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["absence_reason"],
          message: "Selecione o motivo da falta",
        });
      if (v.notified_in_time !== "sim" && v.notified_in_time !== "nao")
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["notified_in_time"],
          message: "Informe se houve aviso em tempo hábil",
        });
    }
    if (v.status === "presente" && v.guardian_signature && !v.guardian_ack_method)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["guardian_ack_method"],
        message: "Informe o método de validação",
      });
  });
type FormValues = z.infer<typeof schema>;

const defaults: FormValues = {
  patient_id: undefined as unknown as number,
  professional_id: undefined as unknown as number,
  session_date: new Date().toISOString().slice(0, 10),
  status: "presente",
  justification: "",
  absence_reason: "",
  notified_in_time: "",
  is_private: false,
  authorization_id: "",
  guardian_signature: false,
  guardian_ack_method: "",
};

export default function AttendanceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id && id !== "novo";
  const attendanceId = isEdit ? Number(id) : undefined;

  const { data: patients } = usePatientOptions();
  const { data: professionals } = useProfessionalOptions();
  const { data: existing, isLoading } = useAttendance(attendanceId);
  const createAttendance = useCreateAttendance();
  const updateAttendance = useUpdateAttendance(attendanceId ?? 0);
  const uploadAttachment = useUploadAttendanceAttachment();
  const { data: attachmentUrl } = useAttendanceAttachmentUrl(
    existing?.attachment_path,
  );
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });

  const patientId = watch("patient_id");
  const isPrivate = watch("is_private");
  const status = watch("status");
  const guardianSigned = watch("guardian_signature");
  const notifiedInTime = watch("notified_in_time");
  const isAbsence = ABSENCE_STATUSES.includes(status);
  const isBillable = isAbsence && notifiedInTime === "nao";
  const { data: authorizations } = useActiveAuthorizationsByPatient(patientId);

  useEffect(() => {
    if (existing) {
      reset({
        patient_id: existing.patient_id,
        professional_id: existing.professional_id,
        session_date: existing.session_date,
        status: existing.status,
        justification: existing.justification ?? "",
        absence_reason: existing.absence_reason ?? "",
        notified_in_time:
          existing.notified_in_time === true
            ? "sim"
            : existing.notified_in_time === false
              ? "nao"
              : "",
        is_private: existing.is_private,
        authorization_id: existing.authorization_id
          ? String(existing.authorization_id)
          : "",
        guardian_signature: existing.guardian_signature,
        guardian_ack_method: existing.guardian_ack_method ?? "",
      });
    }
  }, [existing, reset]);

  async function onSubmit(values: FormValues) {
    const absence = ABSENCE_STATUSES.includes(values.status);
    let attachmentPath = existing?.attachment_path ?? null;
    try {
      if (attachmentFile) {
        attachmentPath = await uploadAttachment.mutateAsync(attachmentFile);
      }
    } catch (e) {
      toast.error("Falha ao enviar o atestado", {
        description: e instanceof Error ? e.message : undefined,
      });
      return;
    }

    const notified = absence
      ? values.notified_in_time === "sim"
        ? true
        : values.notified_in_time === "nao"
          ? false
          : null
      : null;

    const payload = {
      patient_id: values.patient_id,
      professional_id: values.professional_id,
      session_date: values.session_date,
      status: values.status,
      justification: values.justification || null,
      absence_reason: absence ? values.absence_reason || null : null,
      attachment_path: attachmentPath,
      notified_in_time: notified,
      // Falta tardia (sem aviso em tempo hábil) é faturável.
      billable_absence: absence && notified === false,
      is_private: values.is_private,
      authorization_id: values.is_private
        ? null
        : values.authorization_id
          ? Number(values.authorization_id)
          : null,
      guardian_signature: values.guardian_signature,
      guardian_ack_method:
        values.status === "presente" && values.guardian_signature
          ? values.guardian_ack_method || null
          : null,
    };

    try {
      if (isEdit) {
        await updateAttendance.mutateAsync(payload);
        toast.success("Registro atualizado");
      } else {
        await createAttendance.mutateAsync(payload);
        toast.success("Registro criado");
      }
      navigate("/frequencia");
    } catch (e) {
      toast.error("Não foi possível salvar", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

  if (isEdit && isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? "Editar registro" : "Novo registro de frequência"}
        description="Presença, falta ou cancelamento de sessão."
        actions={
          <Button variant="outline" onClick={() => navigate("/frequencia")}>
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Sessão</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Paciente" error={errors.patient_id?.message}>
              <Controller
                control={control}
                name="patient_id"
                render={({ field }) => (
                  <Combobox
                    value={field.value ? String(field.value) : ""}
                    onValueChange={(v) => field.onChange(Number(v))}
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
            <Field label="Status" error={errors.status?.message}>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(attendanceStatusLabels).map(([v, label]) => (
                        <SelectItem key={v} value={v}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            {status !== "presente" && (
              <Field
                label="Justificativa"
                error={errors.justification?.message}
                className="sm:col-span-2"
              >
                <textarea
                  {...register("justification")}
                  rows={3}
                  className="flex w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Motivo da falta ou cancelamento"
                />
              </Field>
            )}
            {isAbsence && (
              <>
                <Field label="Motivo da falta" error={errors.absence_reason?.message}>
                  <Controller
                    control={control}
                    name="absence_reason"
                    render={({ field }) => (
                      <Select value={field.value ?? ""} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o motivo" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(absenceReasonLabels).map(([v, label]) => (
                            <SelectItem key={v} value={v}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
                <Field
                  label="Aviso em tempo hábil para realocação?"
                  error={errors.notified_in_time?.message}
                >
                  <Controller
                    control={control}
                    name="notified_in_time"
                    render={({ field }) => (
                      <Select value={field.value ?? ""} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sim">
                            Sim — agenda liberada, sem ônus
                          </SelectItem>
                          <SelectItem value="nao">
                            Não — falta passível de cobrança
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {isBillable && (
                    <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-destructive">
                      <AlertTriangle className="h-3 w-3" /> Falta passível de
                      cobrança
                    </p>
                  )}
                </Field>
                <Field label="Anexar atestado/comprovante" className="sm:col-span-2">
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/*"
                    onChange={(e) =>
                      setAttachmentFile(e.target.files?.[0] ?? null)
                    }
                    className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-secondary/70"
                  />
                  {existing?.attachment_path && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Atestado atual:{" "}
                      {attachmentUrl ? (
                        <a
                          href={attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-medium text-accent hover:underline"
                        >
                          abrir <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        "carregando…"
                      )}
                      {attachmentFile && " — será substituído ao salvar."}
                    </p>
                  )}
                </Field>
              </>
            )}
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
              <Field label="Guia ativa (opcional)" className="sm:col-span-2">
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
                            {a.guide_number} · {a.procedure_name}
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
            <Field label="Ciência do responsável" className="sm:col-span-2">
              <Controller
                control={control}
                name="guardian_signature"
                render={({ field }) => (
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(v) => field.onChange(Boolean(v))}
                    />
                    Responsável assinou / confirmou a ciência do atendimento
                  </label>
                )}
              />
            </Field>
            {status === "presente" && guardianSigned && (
              <Field
                label="Método de validação da ciência"
                error={errors.guardian_ack_method?.message}
                className="sm:col-span-2"
              >
                <Controller
                  control={control}
                  name="guardian_ack_method"
                  render={({ field }) => (
                    <Select value={field.value ?? ""} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o método" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(guardianAckMethodLabels).map(([v, label]) => (
                          <SelectItem key={v} value={v}>
                            {label}
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

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate("/frequencia")}>
            Cancelar
          </Button>
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
    </div>
  );
}
