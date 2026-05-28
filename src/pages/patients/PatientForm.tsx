import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2, MapPin, Save } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field } from "@/components/form/Field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { maskCPF, maskCEP, maskPhone, unmask, isValidCPF } from "@/lib/masks";
import { fetchCep } from "@/lib/brasilapi";
import { genderLabels, paymentTypeLabels } from "@/lib/labels";
import {
  usePatient,
  useCreatePatient,
  useUpdatePatient,
} from "@/features/patients/api";

const optionalCpf = z
  .string()
  .optional()
  .refine((v) => !v || isValidCPF(v), "CPF inválido");

const schema = z.object({
  name: z.string().min(3, "Informe o nome do paciente"),
  cpf: optionalCpf,
  birth_date: z.string().min(1, "Informe a data de nascimento"),
  gender: z.enum(["masculino", "feminino", "outro"]),
  guardian_name: z.string().min(3, "Informe o responsável"),
  guardian_cpf: z.string().refine(isValidCPF, "CPF do responsável inválido"),
  guardian_phone: z
    .string()
    .refine((v) => unmask(v).length >= 10, "Telefone inválido"),
  guardian_email: z.string().email("E-mail inválido").or(z.literal("")).optional(),
  payment_type: z.enum(["operadora", "particular"]),
  health_plan_name: z.string().optional(),
  health_plan_card: z.string().optional(),
  cid10_primary: z.string().min(1, "Informe o CID-10 principal"),
  cid10_secondary: z.string().optional(),
  diagnosis: z.string().optional(),
  address: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

const defaults: FormValues = {
  name: "",
  cpf: "",
  birth_date: "",
  gender: "masculino",
  guardian_name: "",
  guardian_cpf: "",
  guardian_phone: "",
  guardian_email: "",
  payment_type: "operadora",
  health_plan_name: "",
  health_plan_card: "",
  cid10_primary: "",
  cid10_secondary: "",
  diagnosis: "",
  address: "",
};

export default function PatientForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id && id !== "novo";
  const patientId = isEdit ? Number(id) : undefined;

  const { data: existing, isLoading } = usePatient(patientId);
  const createPatient = useCreatePatient();
  const updatePatient = useUpdatePatient(patientId ?? 0);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: defaults });

  useEffect(() => {
    if (existing) {
      reset({
        name: existing.name,
        cpf: existing.cpf ? maskCPF(existing.cpf) : "",
        birth_date: existing.birth_date,
        gender: existing.gender,
        guardian_name: existing.guardian_name,
        guardian_cpf: maskCPF(existing.guardian_cpf),
        guardian_phone: maskPhone(existing.guardian_phone),
        guardian_email: existing.guardian_email ?? "",
        payment_type: existing.payment_type,
        health_plan_name: existing.health_plan_name ?? "",
        health_plan_card: existing.health_plan_card ?? "",
        cid10_primary: existing.cid10_primary,
        cid10_secondary: existing.cid10_secondary ?? "",
        diagnosis: existing.diagnosis ?? "",
        address: existing.address ?? "",
      });
    }
  }, [existing, reset]);

  const paymentType = watch("payment_type");
  const [cep, setCep] = useState("");
  const [cepLoading, setCepLoading] = useState(false);

  async function lookupCep() {
    const digits = unmask(cep);
    if (digits.length !== 8) {
      toast.error("Digite os 8 dígitos do CEP");
      return;
    }
    setCepLoading(true);
    try {
      const info = await fetchCep(digits);
      if (!info) {
        toast.error("CEP não encontrado");
        return;
      }
      const formatted = [
        info.street,
        info.neighborhood,
        info.city && info.state ? `${info.city} - ${info.state}` : info.city,
        maskCEP(info.cep),
      ]
        .filter(Boolean)
        .join(", ");
      setValue("address", formatted, { shouldDirty: true });
      toast.success("Endereço preenchido");
    } catch (e) {
      toast.error("Falha ao consultar CEP", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setCepLoading(false);
    }
  }

  async function onSubmit(values: FormValues) {
    const payload = {
      name: values.name,
      cpf: values.cpf ? unmask(values.cpf) : null,
      birth_date: values.birth_date,
      gender: values.gender,
      guardian_name: values.guardian_name,
      guardian_cpf: unmask(values.guardian_cpf),
      guardian_phone: unmask(values.guardian_phone),
      guardian_email: values.guardian_email || null,
      payment_type: values.payment_type,
      health_plan_name:
        values.payment_type === "operadora" ? values.health_plan_name || null : null,
      health_plan_card:
        values.payment_type === "operadora" ? values.health_plan_card || null : null,
      cid10_primary: values.cid10_primary,
      cid10_secondary: values.cid10_secondary || null,
      diagnosis: values.diagnosis || null,
      address: values.address || null,
    };

    try {
      if (isEdit) {
        await updatePatient.mutateAsync(payload);
        toast.success("Paciente atualizado");
      } else {
        await createPatient.mutateAsync(payload);
        toast.success("Paciente cadastrado");
      }
      navigate("/pacientes");
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
        title={isEdit ? "Editar paciente" : "Novo paciente"}
        description="Dados cadastrais, responsável e diagnóstico."
        actions={
          <Button variant="outline" onClick={() => navigate("/pacientes")}>
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dados do paciente</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome completo" error={errors.name?.message} className="sm:col-span-2">
              <Input {...register("name")} placeholder="Nome do paciente" />
            </Field>
            <Field label="Data de nascimento" error={errors.birth_date?.message}>
              <Controller
                control={control}
                name="birth_date"
                render={({ field }) => (
                  <DatePicker
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="dd/mm/aaaa"
                  />
                )}
              />
            </Field>
            <Field label="Sexo" error={errors.gender?.message}>
              <Controller
                control={control}
                name="gender"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(genderLabels).map(([v, label]) => (
                        <SelectItem key={v} value={v}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="CPF (opcional)" error={errors.cpf?.message}>
              <Controller
                control={control}
                name="cpf"
                render={({ field }) => (
                  <Input
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(maskCPF(e.target.value))}
                    placeholder="000.000.000-00"
                    inputMode="numeric"
                  />
                )}
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Responsável</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome do responsável" error={errors.guardian_name?.message} className="sm:col-span-2">
              <Input {...register("guardian_name")} placeholder="Nome do responsável" />
            </Field>
            <Field label="CPF do responsável" error={errors.guardian_cpf?.message}>
              <Controller
                control={control}
                name="guardian_cpf"
                render={({ field }) => (
                  <Input
                    value={field.value}
                    onChange={(e) => field.onChange(maskCPF(e.target.value))}
                    placeholder="000.000.000-00"
                    inputMode="numeric"
                  />
                )}
              />
            </Field>
            <Field label="Telefone" error={errors.guardian_phone?.message}>
              <Controller
                control={control}
                name="guardian_phone"
                render={({ field }) => (
                  <Input
                    value={field.value}
                    onChange={(e) => field.onChange(maskPhone(e.target.value))}
                    placeholder="(00) 00000-0000"
                    inputMode="numeric"
                  />
                )}
              />
            </Field>
            <Field label="E-mail (opcional)" error={errors.guardian_email?.message} className="sm:col-span-2">
              <Input {...register("guardian_email")} placeholder="responsavel@email.com" />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pagamento e plano</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Tipo de pagamento" error={errors.payment_type?.message}>
              <Controller
                control={control}
                name="payment_type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(paymentTypeLabels).map(([v, label]) => (
                        <SelectItem key={v} value={v}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            {paymentType === "operadora" && (
              <>
                <Field label="Operadora / plano">
                  <Input {...register("health_plan_name")} placeholder="Nome da operadora" />
                </Field>
                <Field label="Carteirinha">
                  <Input {...register("health_plan_card")} placeholder="Número da carteirinha" />
                </Field>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Diagnóstico</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="CID-10 principal" error={errors.cid10_primary?.message}>
              <Input {...register("cid10_primary")} placeholder="Ex.: F84.0" />
            </Field>
            <Field label="CID-10 secundário (opcional)">
              <Input {...register("cid10_secondary")} placeholder="Ex.: F80.9" />
            </Field>
            <Field label="Observações do diagnóstico" className="sm:col-span-2">
              <textarea
                {...register("diagnosis")}
                rows={3}
                className="flex w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Detalhes relevantes do diagnóstico"
              />
            </Field>
            <Field label="CEP (opcional)">
              <div className="flex gap-2">
                <Input
                  value={cep}
                  onChange={(e) => setCep(maskCEP(e.target.value))}
                  placeholder="00000-000"
                  inputMode="numeric"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={lookupCep}
                  disabled={cepLoading || unmask(cep).length !== 8}
                >
                  {cepLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <MapPin className="h-4 w-4" /> Buscar
                    </>
                  )}
                </Button>
              </div>
            </Field>
            <Field label="Endereço (opcional)">
              <Input
                {...register("address")}
                placeholder="Rua, número, bairro, cidade"
              />
            </Field>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate("/pacientes")}>
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
