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
import { Field } from "@/components/form/Field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { maskCPF, maskPhone, unmask, isValidCPF } from "@/lib/masks";
import { specialtyLabels } from "@/lib/labels";
import { BR_STATES, COUNCIL_TYPES } from "@/lib/constants";
import {
  useProfessional,
  useCreateProfessional,
  useUpdateProfessional,
} from "@/features/professionals/api";

const specialties = Object.keys(specialtyLabels) as [
  keyof typeof specialtyLabels,
  ...(keyof typeof specialtyLabels)[],
];

const schema = z.object({
  name: z.string().min(3, "Informe o nome"),
  cpf: z.string().refine(isValidCPF, "CPF inválido"),
  specialty: z.enum(specialties),
  council_type: z.string().min(2, "Informe o conselho"),
  council_number: z.string().min(1, "Informe o número do registro"),
  council_state: z.string().length(2, "UF"),
  email: z.string().email("E-mail inválido").or(z.literal("")).optional(),
  phone: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

const defaults: FormValues = {
  name: "",
  cpf: "",
  specialty: "psicologia_aba",
  council_type: "CRP",
  council_number: "",
  council_state: "SP",
  email: "",
  phone: "",
};

export default function ProfessionalForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id && id !== "novo";
  const professionalId = isEdit ? Number(id) : undefined;

  const { data: existing, isLoading } = useProfessional(professionalId);
  const createProfessional = useCreateProfessional();
  const updateProfessional = useUpdateProfessional(professionalId ?? 0);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: defaults });

  useEffect(() => {
    if (existing) {
      reset({
        name: existing.name,
        cpf: maskCPF(existing.cpf),
        specialty: existing.specialty,
        council_type: existing.council_type,
        council_number: existing.council_number,
        council_state: existing.council_state,
        email: existing.email ?? "",
        phone: existing.phone ? maskPhone(existing.phone) : "",
      });
    }
  }, [existing, reset]);

  async function onSubmit(values: FormValues) {
    const payload = {
      name: values.name,
      cpf: unmask(values.cpf),
      specialty: values.specialty,
      council_type: values.council_type,
      council_number: values.council_number,
      council_state: values.council_state,
      email: values.email || null,
      phone: values.phone ? unmask(values.phone) : null,
    };

    try {
      if (isEdit) {
        await updateProfessional.mutateAsync(payload);
        toast.success("Profissional atualizado");
      } else {
        await createProfessional.mutateAsync(payload);
        toast.success("Profissional cadastrado");
      }
      navigate("/profissionais");
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
        title={isEdit ? "Editar profissional" : "Novo profissional"}
        description="Dados cadastrais e registro no conselho."
        actions={
          <Button variant="outline" onClick={() => navigate("/profissionais")}>
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dados do profissional</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome completo" error={errors.name?.message} className="sm:col-span-2">
              <Input {...register("name")} placeholder="Nome do profissional" />
            </Field>
            <Field label="CPF" error={errors.cpf?.message}>
              <Controller
                control={control}
                name="cpf"
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conselho profissional</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <Field label="Conselho" error={errors.council_type?.message}>
              <Controller
                control={control}
                name="council_type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNCIL_TYPES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="Número do registro" error={errors.council_number?.message}>
              <Input {...register("council_number")} placeholder="00000" />
            </Field>
            <Field label="UF" error={errors.council_state?.message}>
              <Controller
                control={control}
                name="council_state"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BR_STATES.map((uf) => (
                        <SelectItem key={uf} value={uf}>
                          {uf}
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
            <CardTitle>Contato</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="E-mail (opcional)" error={errors.email?.message}>
              <Input {...register("email")} placeholder="profissional@email.com" />
            </Field>
            <Field label="Telefone (opcional)">
              <Controller
                control={control}
                name="phone"
                render={({ field }) => (
                  <Input
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(maskPhone(e.target.value))}
                    placeholder="(00) 00000-0000"
                    inputMode="numeric"
                  />
                )}
              />
            </Field>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate("/profissionais")}>
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
