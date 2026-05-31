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
  Archive,
  ArchiveRestore,
  Stethoscope,
  UserCog,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  useSetProfessionalActive,
  useProfessionalSpecialties,
  useSaveProfessionalSpecialties,
  type Specialty,
} from "@/features/professionals/api";

const specialties = Object.keys(specialtyLabels) as [
  keyof typeof specialtyLabels,
  ...(keyof typeof specialtyLabels)[],
];

const schema = z
  .object({
    name: z.string().min(3, "Informe o nome"),
    cpf: z.string().refine(isValidCPF, "CPF inválido"),
    specialties: z
      .array(z.enum(specialties))
      .min(1, "Selecione ao menos uma especialidade"),
    council_type: z.string().min(2, "Informe o conselho"),
    council_number: z.string().min(1, "Informe o número do registro"),
    council_state: z.string().length(2, "UF"),
    email: z.string().email("E-mail inválido").or(z.literal("")).optional(),
    phone: z.string().optional(),
    is_coordinator: z.boolean(),
    coordinator_specialty: z.string().optional(),
    is_at_supervisor: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (v.is_coordinator) {
      if (!v.coordinator_specialty)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["coordinator_specialty"],
          message: "Selecione a especialidade coordenada",
        });
      else if (!v.specialties.includes(v.coordinator_specialty as Specialty))
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["coordinator_specialty"],
          message: "O profissional precisa possuir essa especialidade",
        });
    }
  });
type FormValues = z.infer<typeof schema>;

const defaults: FormValues = {
  name: "",
  cpf: "",
  specialties: [],
  council_type: "CRP",
  council_number: "",
  council_state: "SP",
  email: "",
  phone: "",
  is_coordinator: false,
  coordinator_specialty: "",
  is_at_supervisor: false,
};

export default function ProfessionalForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id && id !== "novo";
  const professionalId = isEdit ? Number(id) : undefined;

  const { data: existing, isLoading } = useProfessional(professionalId);
  const { data: existingSpecialties } = useProfessionalSpecialties(professionalId);
  const createProfessional = useCreateProfessional();
  const updateProfessional = useUpdateProfessional(professionalId ?? 0);
  const setActiveMutation = useSetProfessionalActive();
  const saveSpecialties = useSaveProfessionalSpecialties();
  const [toggleOpen, setToggleOpen] = useState(false);

  const isActive = existing?.active ?? true;

  async function onToggleActive() {
    if (!professionalId) return;
    const nextActive = !isActive;
    try {
      await setActiveMutation.mutateAsync({ id: professionalId, active: nextActive });
      toast.success(nextActive ? "Profissional reativado" : "Profissional inativado");
    } catch (e) {
      toast.error(nextActive ? "Falha ao reativar" : "Falha ao inativar", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setToggleOpen(false);
    }
  }

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: defaults });

  const selectedSpecialties = watch("specialties");
  const isCoordinator = watch("is_coordinator");

  useEffect(() => {
    if (existing) {
      reset({
        name: existing.name,
        cpf: maskCPF(existing.cpf),
        specialties: existing.specialty ? [existing.specialty] : [],
        council_type: existing.council_type,
        council_number: existing.council_number,
        council_state: existing.council_state,
        email: existing.email ?? "",
        phone: existing.phone ? maskPhone(existing.phone) : "",
        is_coordinator: !!existing.coordinator_specialty,
        coordinator_specialty: existing.coordinator_specialty ?? "",
        is_at_supervisor: existing.is_at_supervisor,
      });
    }
  }, [existing, reset]);

  // A lista N:N chega à parte; sobrescreve o fallback do reset quando carrega.
  useEffect(() => {
    if (existingSpecialties && existingSpecialties.length > 0) {
      setValue("specialties", existingSpecialties);
    }
  }, [existingSpecialties, setValue]);

  function toggleSpecialty(s: Specialty, checked: boolean) {
    const set = new Set(selectedSpecialties);
    if (checked) set.add(s);
    else set.delete(s);
    // Mantém a ordem estável dos rótulos.
    const next = (specialties as Specialty[]).filter((k) => set.has(k));
    setValue("specialties", next, { shouldValidate: true, shouldDirty: true });
  }

  async function onSubmit(values: FormValues) {
    const principal = values.specialties[0];
    const payload = {
      name: values.name,
      cpf: unmask(values.cpf),
      specialty: principal,
      coordinator_specialty: values.is_coordinator
        ? (values.coordinator_specialty as Specialty)
        : null,
      is_at_supervisor: values.is_at_supervisor,
      council_type: values.council_type,
      council_number: values.council_number,
      council_state: values.council_state,
      email: values.email || null,
      phone: values.phone ? unmask(values.phone) : null,
    };

    try {
      let pid = professionalId;
      if (isEdit) {
        await updateProfessional.mutateAsync(payload);
      } else {
        const created = await createProfessional.mutateAsync(payload);
        pid = created.id;
      }
      if (pid) {
        await saveSpecialties.mutateAsync({
          professionalId: pid,
          specialties: values.specialties,
        });
      }
      toast.success(isEdit ? "Profissional atualizado" : "Profissional cadastrado");
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
          <div className="flex items-center gap-2">
            {isEdit && (
              <Badge variant={isActive ? "success" : "muted"}>
                {isActive ? "Ativo" : "Inativo"}
              </Badge>
            )}
            <Button variant="outline" onClick={() => navigate("/profissionais")}>
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Button>
          </div>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dados Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome completo" error={errors.name?.message} className="sm:col-span-2">
              <Input {...register("name")} placeholder="Nome completo do profissional" />
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-muted-foreground" />
              Especialidades
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Selecione todas as áreas em que o profissional atua. A primeira
              marcada é considerada a principal.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {(Object.entries(specialtyLabels) as [Specialty, string][]).map(
                ([value, label]) => {
                  const checked = selectedSpecialties.includes(value);
                  return (
                    <label
                      key={value}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background p-3 text-sm transition-colors hover:bg-secondary/50"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) => toggleSpecialty(value, Boolean(v))}
                      />
                      {label}
                    </label>
                  );
                },
              )}
            </div>
            {errors.specialties?.message && (
              <p className="text-sm text-destructive">
                {errors.specialties.message}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-4 w-4 text-muted-foreground" />
              Papéis de gestão
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Coordenador de especialidade" className="sm:col-span-2">
              <Controller
                control={control}
                name="is_coordinator"
                render={({ field }) => (
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(v) => field.onChange(Boolean(v))}
                    />
                    É coordenador de uma especialidade (pode aprovar a evolução
                    mensal)
                  </label>
                )}
              />
            </Field>
            {isCoordinator && (
              <Field
                label="Especialidade coordenada"
                error={errors.coordinator_specialty?.message}
                className="sm:col-span-2"
              >
                <Controller
                  control={control}
                  name="coordinator_specialty"
                  render={({ field }) => (
                    <Select value={field.value ?? ""} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a especialidade" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedSpecialties.map((s) => (
                          <SelectItem key={s} value={s}>
                            {specialtyLabels[s]}
                          </SelectItem>
                        ))}
                        {selectedSpecialties.length === 0 && (
                          <div className="p-3 text-sm text-muted-foreground">
                            Marque ao menos uma especialidade acima.
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
            )}
            <Field label="Supervisor de AT" className="sm:col-span-2">
              <Controller
                control={control}
                name="is_at_supervisor"
                render={({ field }) => (
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(v) => field.onChange(Boolean(v))}
                    />
                    Atua como supervisor de aplicadores ABA (domiciliar/escolar)
                  </label>
                )}
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Registro Profissional</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <Field label="Tipo de conselho" error={errors.council_type?.message}>
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
              <Input {...register("council_number")} placeholder="Ex: 06/12345" />
            </Field>
            <Field label="UF do conselho" error={errors.council_state?.message}>
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

      {isEdit && (
        <Card className="mt-6 border-dashed">
          <CardHeader>
            <CardTitle>Status do profissional</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-prose text-sm text-muted-foreground">
              {isActive
                ? "Profissional ativo. Inativar preserva todo o histórico (prontuários, evoluções assinadas, relatórios) e apenas o oculta de listagens e seleções de novos atendimentos."
                : "Profissional inativo: oculto das listagens ativas, mas visível em consultas históricas. Reative para restaurar o uso operacional."}
            </p>
            <Button
              type="button"
              variant={isActive ? "outline" : "brand"}
              className={isActive ? "text-destructive hover:text-destructive" : ""}
              onClick={() => setToggleOpen(true)}
              disabled={setActiveMutation.isPending}
            >
              {isActive ? (
                <>
                  <Archive className="h-4 w-4" /> Inativar profissional
                </>
              ) : (
                <>
                  <ArchiveRestore className="h-4 w-4" /> Reativar profissional
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={toggleOpen} onOpenChange={setToggleOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isActive ? "Inativar profissional?" : "Reativar profissional?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isActive
                ? "O profissional deixará de aparecer nas listagens e seleções de novos atendimentos. Os registros históricos são preservados e a ação pode ser revertida."
                : "O profissional voltará a aparecer nas listagens e poderá ser selecionado em novos atendimentos."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={onToggleActive}
              disabled={setActiveMutation.isPending}
            >
              {isActive ? "Inativar" : "Reativar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
