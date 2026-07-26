import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  Loader2,
  MapPin,
  Save,
  Sparkles,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Field } from "@/components/form/Field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { maskCNPJ, maskCEP, maskPhone, unmask } from "@/lib/masks";
import { fetchCnpj } from "@/lib/brasilapi";
import { useCepLookup } from "@/hooks/useCepLookup";
import {
  clinicPlanLabels,
  clinicPlanStatusLabels,
  clinicStatusLabels,
  clinicStatusVariant,
} from "@/lib/labels";
import { useClinicRecord, useSaveClinic } from "@/features/clinics/api";
import type { Enums } from "@/types/database";
import { ClinicAdminsPanel } from "./ClinicAdminsPanel";

const schema = z.object({
  name: z.string().min(2, "Informe a razão social"),
  trade_name: z.string().optional(),
  cnpj: z.string().min(14, "CNPJ inválido").max(18),
  email: z.string().email("E-mail inválido"),
  phone: z.string().optional(),
  zip_code: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().max(2, "Use a sigla da UF").optional(),
  status: z.enum(["em_implantacao", "ativa", "suspensa", "encerrada"]),
  plan: z.enum(["trial", "basic", "professional", "enterprise"]),
  plan_status: z.enum(["active", "past_due", "canceled", "trialing"]),
  max_professionals: z.coerce.number().int().min(1, "Mínimo 1"),
  max_patients: z.coerce.number().int().min(1, "Mínimo 1"),
});
type FormValues = z.infer<typeof schema>;

const DEFAULTS: FormValues = {
  name: "",
  trade_name: "",
  cnpj: "",
  email: "",
  phone: "",
  zip_code: "",
  address: "",
  city: "",
  state: "",
  status: "em_implantacao",
  plan: "trial",
  plan_status: "trialing",
  max_professionals: 5,
  max_patients: 50,
};

export default function ClinicForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const clinicId = id && id !== "nova" ? Number(id) : undefined;
  const isNew = !clinicId;

  const { data: clinic, isLoading } = useClinicRecord(clinicId);
  const save = useSaveClinic();
  const { loading: cepLoading, lookup: lookupCepInfo } = useCepLookup();
  const [cnpjLoading, setCnpjLoading] = useState(false);

  const tab = searchParams.get("aba") === "equipe" && !isNew ? "equipe" : "dados";

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULTS,
  });

  useEffect(() => {
    if (!clinic) return;
    reset({
      name: clinic.name,
      trade_name: clinic.trade_name ?? "",
      cnpj: clinic.cnpj,
      email: clinic.email,
      phone: clinic.phone ?? "",
      zip_code: clinic.zip_code ?? "",
      address: clinic.address ?? "",
      city: clinic.city ?? "",
      state: clinic.state ?? "",
      status: clinic.status,
      plan: clinic.plan,
      plan_status: clinic.plan_status,
      max_professionals: clinic.max_professionals,
      max_patients: clinic.max_patients,
    });
  }, [clinic, reset]);

  async function lookupCnpj() {
    const cnpj = unmask(getValues("cnpj") ?? "");
    if (cnpj.length !== 14) {
      toast.error("Digite os 14 dígitos do CNPJ");
      return;
    }
    setCnpjLoading(true);
    try {
      const info = await fetchCnpj(cnpj);
      if (!info) {
        toast.error("CNPJ não encontrado");
        return;
      }
      setValue("name", info.razao_social, { shouldDirty: true });
      if (info.nome_fantasia)
        setValue("trade_name", info.nome_fantasia, { shouldDirty: true });
      if (info.email) setValue("email", info.email, { shouldDirty: true });
      if (info.ddd_telefone_1)
        setValue("phone", maskPhone(info.ddd_telefone_1), { shouldDirty: true });
      if (info.cep) setValue("zip_code", maskCEP(info.cep), { shouldDirty: true });
      if (info.uf) setValue("state", info.uf, { shouldDirty: true });
      if (info.municipio) setValue("city", info.municipio, { shouldDirty: true });
      const street = [info.logradouro, info.numero, info.bairro]
        .filter(Boolean)
        .join(", ");
      if (street) setValue("address", street, { shouldDirty: true });
      toast.success("Dados da empresa preenchidos");
    } catch (e) {
      toast.error("Falha ao consultar BrasilAPI", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setCnpjLoading(false);
    }
  }

  function lookupCep() {
    lookupCepInfo(getValues("zip_code") ?? "", (info) => {
      setValue("state", info.state, { shouldDirty: true });
      setValue("city", info.city, { shouldDirty: true });
      const street = [info.street, info.neighborhood].filter(Boolean).join(", ");
      if (street) setValue("address", street, { shouldDirty: true });
    });
  }

  async function onSubmit(values: FormValues) {
    try {
      const saved = await save.mutateAsync({
        id: clinicId,
        values: {
          name: values.name,
          trade_name: values.trade_name || null,
          cnpj: values.cnpj,
          email: values.email,
          phone: values.phone || null,
          zip_code: values.zip_code || null,
          address: values.address || null,
          city: values.city || null,
          state: values.state ? values.state.toUpperCase() : null,
          status: values.status,
          plan: values.plan,
          plan_status: values.plan_status,
          max_professionals: values.max_professionals,
          max_patients: values.max_patients,
        },
      });
      if (isNew) {
        toast.success("Clínica cadastrada", {
          description: "Agora crie o administrador titular dela.",
        });
        navigate(`/clinicas/${saved.id}?aba=equipe`, { replace: true });
      } else {
        toast.success("Dados atualizados");
      }
    } catch (e) {
      toast.error("Não foi possível salvar", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

  const cnpjDigitsLen = unmask(watch("cnpj") ?? "").length;
  const cepDigitsLen = unmask(watch("zip_code") ?? "").length;
  const currentStatus = watch("status");

  if (clinicId && isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isNew ? "Nova clínica" : (clinic?.name ?? "Clínica")}
        description={
          isNew
            ? "Cadastre o tenant e, na sequência, crie o acesso do administrador titular."
            : "Dados cadastrais, situação do contrato e equipe de acesso."
        }
        actions={
          <div className="flex items-center gap-3">
            {!isNew && (
              <Badge variant={clinicStatusVariant[currentStatus]}>
                {clinicStatusLabels[currentStatus]}
              </Badge>
            )}
            <Button variant="outline" onClick={() => navigate("/clinicas")}>
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Button>
          </div>
        }
      />

      <Tabs
        value={tab}
        onValueChange={(v) => {
          const next = new URLSearchParams(searchParams);
          if (v === "dados") next.delete("aba");
          else next.set("aba", v);
          setSearchParams(next, { replace: true });
        }}
      >
        <TabsList>
          <TabsTrigger value="dados">
            <Building2 className="mr-2 h-4 w-4" /> Dados da clínica
          </TabsTrigger>
          <TabsTrigger value="equipe" disabled={isNew}>
            <Users className="mr-2 h-4 w-4" /> Administradores
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dados">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Identificação</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <Field label="CNPJ" required error={errors.cnpj?.message}>
                  <div className="flex gap-2">
                    <Input
                      placeholder="00.000.000/0000-00"
                      inputMode="numeric"
                      {...register("cnpj", {
                        onChange: (e) => {
                          e.target.value = maskCNPJ(e.target.value);
                        },
                      })}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={lookupCnpj}
                      disabled={cnpjLoading || cnpjDigitsLen !== 14}
                    >
                      {cnpjLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" /> Buscar
                        </>
                      )}
                    </Button>
                  </div>
                </Field>
                <Field label="Telefone" error={errors.phone?.message}>
                  <Input
                    placeholder="(00) 00000-0000"
                    inputMode="numeric"
                    {...register("phone", {
                      onChange: (e) => {
                        e.target.value = maskPhone(e.target.value);
                      },
                    })}
                  />
                </Field>
                <Field label="Razão social" required error={errors.name?.message}>
                  <Input {...register("name")} />
                </Field>
                <Field label="Nome fantasia" error={errors.trade_name?.message}>
                  <Input {...register("trade_name")} />
                </Field>
                <Field
                  label="E-mail da clínica"
                  required
                  error={errors.email?.message}
                  className="sm:col-span-2"
                >
                  <Input type="email" {...register("email")} />
                </Field>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Endereço</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <Field label="CEP" error={errors.zip_code?.message}>
                  <div className="flex gap-2">
                    <Input
                      placeholder="00000-000"
                      inputMode="numeric"
                      {...register("zip_code", {
                        onChange: (e) => {
                          e.target.value = maskCEP(e.target.value);
                        },
                      })}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={lookupCep}
                      disabled={cepLoading || cepDigitsLen !== 8}
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
                <Field label="Endereço" error={errors.address?.message}>
                  <Input
                    placeholder="Rua, número, bairro"
                    {...register("address")}
                  />
                </Field>
                <Field label="Cidade" error={errors.city?.message}>
                  <Input {...register("city")} />
                </Field>
                <Field label="UF" error={errors.state?.message}>
                  <Input maxLength={2} className="uppercase" {...register("state")} />
                </Field>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contrato e limites</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field
                  label="Situação"
                  required
                  hint="Suspensa ou encerrada bloqueia o acesso de toda a equipe."
                >
                  <Select
                    value={watch("status")}
                    onValueChange={(v) =>
                      setValue("status", v as FormValues["status"], {
                        shouldDirty: true,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(
                        Object.keys(clinicStatusLabels) as Enums<"clinic_status">[]
                      ).map((s) => (
                        <SelectItem key={s} value={s}>
                          {clinicStatusLabels[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Plano" required>
                  <Select
                    value={watch("plan")}
                    onValueChange={(v) =>
                      setValue("plan", v as FormValues["plan"], {
                        shouldDirty: true,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(clinicPlanLabels) as Enums<"clinic_plan">[]).map(
                        (p) => (
                          <SelectItem key={p} value={p}>
                            {clinicPlanLabels[p]}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Status do plano" required>
                  <Select
                    value={watch("plan_status")}
                    onValueChange={(v) =>
                      setValue("plan_status", v as FormValues["plan_status"], {
                        shouldDirty: true,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(
                        Object.keys(
                          clinicPlanStatusLabels,
                        ) as Enums<"clinic_plan_status">[]
                      ).map((p) => (
                        <SelectItem key={p} value={p}>
                          {clinicPlanStatusLabels[p]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field
                  label="Limite de profissionais"
                  required
                  error={errors.max_professionals?.message}
                >
                  <Input
                    type="number"
                    min={1}
                    {...register("max_professionals")}
                  />
                </Field>
                <Field
                  label="Limite de pacientes"
                  required
                  error={errors.max_patients?.message}
                >
                  <Input type="number" min={1} {...register("max_patients")} />
                </Field>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate("/clinicas")}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="brand"
                disabled={save.isPending || (!isNew && !isDirty)}
              >
                {save.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {isNew ? "Cadastrar clínica" : "Salvar alterações"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="equipe">
          {clinicId && (
            <ClinicAdminsPanel
              clinicId={clinicId}
              clinicName={clinic?.name ?? "esta clínica"}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
