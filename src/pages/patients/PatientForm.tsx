import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  MapPin,
  Save,
  User,
  Users,
  CreditCard,
  Stethoscope,
  FileText,
  Sparkles,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/form/Field";
import { FormSection } from "@/components/form/FormSection";
import { CidCombobox } from "@/components/form/CidCombobox";
import { Cid11Combobox } from "@/components/form/Cid11Combobox";
import { cid10ForCid11, findCid11 } from "@/lib/cid11";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { FormLoadingSkeleton } from "@/components/form/FormLoadingSkeleton";
import { maskCPF, maskCEP, maskPhone, unmask, isValidCPF } from "@/lib/masks";
import { useCepLookup } from "@/hooks/useCepLookup";
import { daysUntil } from "@/lib/date";
import { genderLabels, paymentTypeLabels } from "@/lib/labels";
import {
  usePatient,
  useCreatePatient,
  useUpdatePatient,
  useUploadMedicalReport,
  useMedicalReportUrl,
} from "@/features/patients/api";
import { useExtractLaudo } from "@/features/ai/api";

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
  payment_type: z.enum(["operadora", "particular", "liminar"]),
  health_plan_name: z.string().optional(),
  health_plan_card: z.string().optional(),
  liminar_number: z.string().optional(),
  cid11_primary: z.string().optional(),
  cid11_secondary: z.string().optional(),
  cid10_primary: z.string().min(1, "Informe o CID-10 principal"),
  cid10_secondary: z.string().optional(),
  diagnosis: z.string().optional(),
  report_doctor: z.string().optional(),
  report_crm: z.string().optional(),
  report_issue_date: z.string().optional(),
  report_validity_date: z.string().optional(),
  address: z.string().optional(),
}).superRefine((v, ctx) => {
  if (v.payment_type === "liminar") {
    if (!(v.liminar_number ?? "").trim())
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["liminar_number"],
        message: "Informe o número da liminar / processo",
      });
    if (!(v.health_plan_name ?? "").trim())
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["health_plan_name"],
        message: "Informe a operadora vinculada à liminar",
      });
  }
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
  liminar_number: "",
  cid11_primary: "",
  cid11_secondary: "",
  cid10_primary: "",
  cid10_secondary: "",
  diagnosis: "",
  report_doctor: "",
  report_crm: "",
  report_issue_date: "",
  report_validity_date: "",
  address: "",
};

// Lê um File como base64 puro (sem o prefixo data:) para envio à Edge Function.
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

const REPORT_ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/*";

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
        liminar_number: existing.liminar_number ?? "",
        cid11_primary: existing.cid11_primary ?? "",
        cid11_secondary: existing.cid11_secondary ?? "",
        cid10_primary: existing.cid10_primary,
        cid10_secondary: existing.cid10_secondary ?? "",
        diagnosis: existing.diagnosis ?? "",
        report_doctor: existing.report_doctor ?? "",
        report_crm: existing.report_crm ?? "",
        report_issue_date: existing.report_issue_date ?? "",
        report_validity_date: existing.report_validity_date ?? "",
        address: existing.address ?? "",
      });
    }
  }, [existing, reset]);

  const paymentType = watch("payment_type");
  const reportValidity = watch("report_validity_date");
  const cid11Primary = watch("cid11_primary");
  const cid11PrimaryInfo = cid11Primary ? findCid11(cid11Primary) : undefined;
  const [cep, setCep] = useState("");
  const { loading: cepLoading, lookup: lookupCepInfo } = useCepLookup();
  const [reportFile, setReportFile] = useState<File | null>(null);

  const uploadReport = useUploadMedicalReport();
  const extractLaudo = useExtractLaudo();
  const { data: reportUrl } = useMedicalReportUrl(existing?.report_path);

  // Dias até o vencimento do laudo (negativo = vencido).
  const validityDays = reportValidity ? daysUntil(reportValidity) : null;

  async function onReadLaudo() {
    if (!reportFile) {
      toast.error("Selecione o arquivo do laudo primeiro");
      return;
    }
    try {
      const fileBase64 = await fileToBase64(reportFile);
      const mediaType = reportFile.type || "application/pdf";
      const r = await extractLaudo.mutateAsync({ fileBase64, mediaType });
      if (r.doctor) setValue("report_doctor", r.doctor, { shouldDirty: true });
      if (r.crm_uf) setValue("report_crm", r.crm_uf, { shouldDirty: true });
      if (r.issue_date)
        setValue("report_issue_date", r.issue_date, { shouldDirty: true });
      if (r.validity_date)
        setValue("report_validity_date", r.validity_date, { shouldDirty: true });
      toast.success("Laudo lido pela IA — confira e ajuste os campos", {
        description:
          r.validity_source === "computed"
            ? "Validade estimada (emissão + 1 ano), pois não havia data explícita."
            : undefined,
      });
    } catch (e) {
      toast.error("Não foi possível ler o laudo", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

  function lookupCep() {
    lookupCepInfo(cep, (info) => {
      const formatted = [
        info.street,
        info.neighborhood,
        info.city && info.state ? `${info.city} - ${info.state}` : info.city,
        maskCEP(info.cep),
      ]
        .filter(Boolean)
        .join(", ");
      setValue("address", formatted, { shouldDirty: true });
    });
  }

  // De-Para CID-11 → CID-10: ao escolher o código CID-11, preenche o CID-10
  // equivalente (faturamento/operadoras), que permanece editável.
  function onChangeCid11(
    field: "cid11_primary" | "cid11_secondary",
    code: string,
  ) {
    setValue(field, code, { shouldDirty: true });
    const mapped = cid10ForCid11(code);
    if (mapped) {
      const target = field === "cid11_primary" ? "cid10_primary" : "cid10_secondary";
      setValue(target, mapped, { shouldDirty: true, shouldValidate: true });
    }
  }

  async function onSubmit(values: FormValues) {
    let reportPath = existing?.report_path ?? null;
    try {
      if (reportFile) {
        reportPath = await uploadReport.mutateAsync(reportFile);
      }
    } catch (e) {
      toast.error("Falha ao enviar o laudo", {
        description: e instanceof Error ? e.message : undefined,
      });
      return;
    }

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
      // Operadora e Liminar (judicial) usam health_plan_name como vínculo com a
      // operadora; carteirinha só na operadora padrão; liminar_number só na
      // liminar.
      health_plan_name:
        values.payment_type === "operadora" || values.payment_type === "liminar"
          ? values.health_plan_name || null
          : null,
      health_plan_card:
        values.payment_type === "operadora" ? values.health_plan_card || null : null,
      liminar_number:
        values.payment_type === "liminar" ? values.liminar_number || null : null,
      cid11_primary: values.cid11_primary || null,
      cid11_secondary: values.cid11_secondary || null,
      cid10_primary: values.cid10_primary,
      cid10_secondary: values.cid10_secondary || null,
      diagnosis: values.diagnosis || null,
      report_path: reportPath,
      report_doctor: values.report_doctor || null,
      report_crm: values.report_crm || null,
      report_issue_date: values.report_issue_date || null,
      report_validity_date: values.report_validity_date || null,
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
    return <FormLoadingSkeleton />;
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
        <FormSection icon={User} title="Dados do Paciente">
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
            <Field label="Gênero" error={errors.gender?.message}>
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
        </FormSection>

        <FormSection icon={Users} title="Responsável Legal">
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
        </FormSection>

        <FormSection icon={CreditCard} title="Tipo de Atendimento">
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
                <Field label="Nome do plano de saúde">
                  <Input {...register("health_plan_name")} placeholder="Ex: Unimed, Bradesco Saúde" />
                </Field>
                <Field label="Número da carteirinha">
                  <Input {...register("health_plan_card")} placeholder="Número da carteirinha" />
                </Field>
              </>
            )}
            {paymentType === "liminar" && (
              <>
                <Field
                  label="Número da liminar / processo"
                  error={errors.liminar_number?.message}
                >
                  <Input
                    {...register("liminar_number")}
                    placeholder="Ex: 1234567-89.2026.8.26.0100"
                  />
                </Field>
                <Field
                  label="Operadora de saúde vinculada"
                  error={errors.health_plan_name?.message}
                >
                  <Input
                    {...register("health_plan_name")}
                    placeholder="Ex: Unimed, Bradesco Saúde"
                  />
                </Field>
              </>
            )}
        </FormSection>

        <FormSection icon={Stethoscope} title="Diagnóstico / Condição de Saúde">
            <Field
              label="CID-11 principal (opcional)"
              error={errors.cid11_primary?.message}
            >
              <Controller
                control={control}
                name="cid11_primary"
                render={({ field }) => (
                  <Cid11Combobox
                    value={field.value ?? ""}
                    onChange={(v) => onChangeCid11("cid11_primary", v)}
                    placeholder="Selecione o CID-11 (OMS)"
                  />
                )}
              />
              {cid11PrimaryInfo ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {cid11PrimaryInfo.code}
                  </span>{" "}
                  — {cid11PrimaryInfo.description}
                  {cid11PrimaryInfo.cid10 && (
                    <> · CID-10: {cid11PrimaryInfo.cid10}</>
                  )}
                </p>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">
                  Ao escolher o CID-11, o CID-10 equivalente é preenchido
                  automaticamente para compatibilidade com operadoras.
                </p>
              )}
            </Field>
            <Field label="CID-11 secundário (opcional)">
              <Controller
                control={control}
                name="cid11_secondary"
                render={({ field }) => (
                  <Cid11Combobox
                    value={field.value ?? ""}
                    onChange={(v) => onChangeCid11("cid11_secondary", v)}
                    placeholder="Selecione o CID-11 (opcional)"
                  />
                )}
              />
            </Field>
            <Field label="CID-10 principal" error={errors.cid10_primary?.message}>
              <Controller
                control={control}
                name="cid10_primary"
                render={({ field }) => (
                  <CidCombobox
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="Selecione o CID-10"
                  />
                )}
              />
            </Field>
            <Field label="CID-10 secundário (opcional)">
              <Controller
                control={control}
                name="cid10_secondary"
                render={({ field }) => (
                  <CidCombobox
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="Selecione o CID-10 (opcional)"
                  />
                )}
              />
            </Field>
            <Field label="Diagnóstico complementar" className="sm:col-span-2">
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
        </FormSection>

        <FormSection
          icon={FileText}
          title="Laudo médico"
          contentClassName="space-y-4"
        >
            <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <Field label="Arquivo do laudo (PDF ou imagem)">
                <input
                  type="file"
                  accept={REPORT_ACCEPT}
                  onChange={(e) => setReportFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-secondary/70"
                />
              </Field>
              <Button
                type="button"
                variant="outline"
                onClick={onReadLaudo}
                disabled={!reportFile || extractLaudo.isPending}
              >
                {extractLaudo.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 text-brand-blue-light" />
                )}
                Ler com IA
              </Button>
            </div>

            {existing?.report_path && (
              <p className="text-xs text-muted-foreground">
                Laudo atual:{" "}
                {reportUrl ? (
                  <a
                    href={reportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-accent hover:underline"
                  >
                    abrir documento <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  "carregando…"
                )}
                {reportFile && " — será substituído ao salvar."}
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Médico assistente">
                <Input
                  {...register("report_doctor")}
                  placeholder="Nome do médico que assina o laudo"
                />
              </Field>
              <Field label="CRM/UF">
                <Input {...register("report_crm")} placeholder="Ex: CRM/SP 123456" />
              </Field>
              <Field label="Data de emissão do laudo">
                <Controller
                  control={control}
                  name="report_issue_date"
                  render={({ field }) => (
                    <DatePicker
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="dd/mm/aaaa"
                    />
                  )}
                />
              </Field>
              <Field label="Data de validade do laudo">
                <Controller
                  control={control}
                  name="report_validity_date"
                  render={({ field }) => (
                    <DatePicker
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="dd/mm/aaaa"
                    />
                  )}
                />
                {validityDays !== null && validityDays < 0 && (
                  <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-destructive">
                    <AlertTriangle className="h-3 w-3" /> Laudo vencido
                  </p>
                )}
                {validityDays !== null && validityDays >= 0 && validityDays <= 15 && (
                  <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[hsl(38_92%_42%)]">
                    <AlertTriangle className="h-3 w-3" /> Vence em {validityDays}{" "}
                    {validityDays === 1 ? "dia" : "dias"}
                  </p>
                )}
              </Field>
            </div>
        </FormSection>

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
