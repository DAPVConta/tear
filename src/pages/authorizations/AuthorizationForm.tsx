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
import { authorizationStatusLabels, specialtyLabels } from "@/lib/labels";
import { usePatientOptions } from "@/features/patients/api";
import {
  useAuthorization,
  useCreateAuthorization,
  useUpdateAuthorization,
} from "@/features/authorizations/api";

const specialties = Object.keys(specialtyLabels) as [
  keyof typeof specialtyLabels,
  ...(keyof typeof specialtyLabels)[],
];
const statuses = Object.keys(authorizationStatusLabels) as [
  keyof typeof authorizationStatusLabels,
  ...(keyof typeof authorizationStatusLabels)[],
];

const schema = z
  .object({
    patient_id: z.coerce.number({ message: "Selecione o paciente" }).int().positive(),
    guide_number: z.string().min(1, "Informe o número da guia"),
    authorization_date: z.string().min(1, "Informe a data"),
    expiration_date: z.string().min(1, "Informe a validade"),
    procedure_code: z.string().min(1, "Informe o código"),
    procedure_name: z.string().min(1, "Informe o procedimento"),
    authorized_quantity: z.coerce.number().int().positive("Quantidade inválida"),
    specialty: z.enum(specialties),
    status: z.enum(statuses),
    observations: z.string().optional(),
  })
  .refine((v) => v.expiration_date >= v.authorization_date, {
    message: "A validade deve ser igual ou posterior à autorização",
    path: ["expiration_date"],
  });
type FormValues = z.infer<typeof schema>;

export default function AuthorizationForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id && id !== "novo";
  const authId = isEdit ? Number(id) : undefined;

  const { data: patients } = usePatientOptions();
  const { data: existing, isLoading } = useAuthorization(authId);
  const createAuth = useCreateAuthorization();
  const updateAuth = useUpdateAuthorization(authId ?? 0);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      patient_id: undefined as unknown as number,
      guide_number: "",
      authorization_date: "",
      expiration_date: "",
      procedure_code: "",
      procedure_name: "",
      authorized_quantity: 1,
      specialty: "psicologia_aba",
      status: "ativa",
      observations: "",
    },
  });

  useEffect(() => {
    if (existing) {
      reset({
        patient_id: existing.patient_id,
        guide_number: existing.guide_number,
        authorization_date: existing.authorization_date,
        expiration_date: existing.expiration_date,
        procedure_code: existing.procedure_code,
        procedure_name: existing.procedure_name,
        authorized_quantity: existing.authorized_quantity,
        specialty: existing.specialty,
        status: existing.status,
        observations: existing.observations ?? "",
      });
    }
  }, [existing, reset]);

  async function onSubmit(values: FormValues) {
    const payload = {
      patient_id: values.patient_id,
      guide_number: values.guide_number,
      authorization_date: values.authorization_date,
      expiration_date: values.expiration_date,
      procedure_code: values.procedure_code,
      procedure_name: values.procedure_name,
      authorized_quantity: values.authorized_quantity,
      specialty: values.specialty,
      status: values.status,
      observations: values.observations || null,
    };
    try {
      if (isEdit) {
        await updateAuth.mutateAsync(payload);
        toast.success("Guia atualizada");
      } else {
        await createAuth.mutateAsync(payload);
        toast.success("Guia cadastrada");
      }
      navigate("/guias");
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
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? "Editar guia" : "Nova guia"}
        description="Autorização da operadora vinculada ao paciente."
        actions={
          <Button variant="outline" onClick={() => navigate("/guias")}>
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dados da guia</CardTitle>
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
            <Field label="Número da guia" error={errors.guide_number?.message}>
              <Input {...register("guide_number")} placeholder="Nº da guia" />
            </Field>
            <Field label="Data de autorização" error={errors.authorization_date?.message}>
              <Controller
                control={control}
                name="authorization_date"
                render={({ field }) => (
                  <DatePicker
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="dd/mm/aaaa"
                  />
                )}
              />
            </Field>
            <Field label="Validade" error={errors.expiration_date?.message}>
              <Controller
                control={control}
                name="expiration_date"
                render={({ field }) => (
                  <DatePicker
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="dd/mm/aaaa"
                  />
                )}
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Procedimento</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Código do procedimento" error={errors.procedure_code?.message}>
              <Input {...register("procedure_code")} placeholder="Ex.: 50000470" />
            </Field>
            <Field label="Nome do procedimento" error={errors.procedure_name?.message}>
              <Input {...register("procedure_name")} placeholder="Descrição" />
            </Field>
            <Field label="Especialidade" error={errors.specialty?.message}>
              <Controller
                control={control}
                name="specialty"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(specialtyLabels).map(([v, label]) => (
                        <SelectItem key={v} value={v}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="Quantidade autorizada" error={errors.authorized_quantity?.message}>
              <Input type="number" min={1} {...register("authorized_quantity")} />
            </Field>
            {isEdit && (
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
                        {/* Apenas status settáveis; vencida/esgotada são derivados */}
                        {(["ativa", "cancelada"] as const).map((v) => (
                          <SelectItem key={v} value={v}>
                            {authorizationStatusLabels[v]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
            )}
            <Field label="Observações" className="sm:col-span-2">
              <textarea
                {...register("observations")}
                rows={3}
                className="flex w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Observações da guia"
              />
            </Field>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate("/guias")}>
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
