import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Save } from "lucide-react";
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
import { Combobox } from "@/components/ui/combobox";
import { Skeleton } from "@/components/ui/skeleton";
import { Field } from "@/components/form/Field";
import { attendanceStatusLabels } from "@/lib/labels";
import { usePatientOptions } from "@/features/patients/api";
import { useProfessionalOptions } from "@/features/professionals/api";
import { useActiveAuthorizationsByPatient } from "@/features/dailyEvolutions/api";
import {
  useAttendance,
  useCreateAttendance,
  useUpdateAttendance,
} from "@/features/attendance/api";

const statuses = Object.keys(attendanceStatusLabels) as [
  keyof typeof attendanceStatusLabels,
  ...(keyof typeof attendanceStatusLabels)[],
];

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
    is_private: z.boolean(),
    authorization_id: z.string(),
    guardian_signature: z.boolean(),
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
  );
type FormValues = z.infer<typeof schema>;

const defaults: FormValues = {
  patient_id: undefined as unknown as number,
  professional_id: undefined as unknown as number,
  session_date: new Date().toISOString().slice(0, 10),
  status: "presente",
  justification: "",
  is_private: false,
  authorization_id: "",
  guardian_signature: false,
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
  const { data: authorizations } = useActiveAuthorizationsByPatient(patientId);

  useEffect(() => {
    if (existing) {
      reset({
        patient_id: existing.patient_id,
        professional_id: existing.professional_id,
        session_date: existing.session_date,
        status: existing.status,
        justification: existing.justification ?? "",
        is_private: existing.is_private,
        authorization_id: existing.authorization_id
          ? String(existing.authorization_id)
          : "",
        guardian_signature: existing.guardian_signature,
      });
    }
  }, [existing, reset]);

  async function onSubmit(values: FormValues) {
    const payload = {
      patient_id: values.patient_id,
      professional_id: values.professional_id,
      session_date: values.session_date,
      status: values.status,
      justification: values.justification || null,
      is_private: values.is_private,
      authorization_id: values.is_private
        ? null
        : values.authorization_id
          ? Number(values.authorization_id)
          : null,
      guardian_signature: values.guardian_signature,
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
              <Input type="date" {...register("session_date")} />
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
            <Field label="Assinatura do responsável" className="sm:col-span-2">
              <Controller
                control={control}
                name="guardian_signature"
                render={({ field }) => (
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(v) => field.onChange(Boolean(v))}
                    />
                    Confirmo a assinatura do responsável neste registro
                  </label>
                )}
              />
            </Field>
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
