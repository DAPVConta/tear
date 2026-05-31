import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Save, Plus, Trash2, Target } from "lucide-react";
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
import { FormLoadingSkeleton } from "@/components/form/FormLoadingSkeleton";
import { Field } from "@/components/form/Field";
import { planStatusLabels, goalStatusLabels } from "@/lib/labels";
import { GOAL_CATEGORIES } from "@/lib/constants";
import { usePatientOptions } from "@/features/patients/api";
import { useProfessionalOptions } from "@/features/professionals/api";
import {
  usePlanWithGoals,
  useSavePlan,
  type GoalInput,
} from "@/features/therapeuticPlans/api";

const planStatuses = Object.keys(planStatusLabels) as [
  keyof typeof planStatusLabels,
  ...(keyof typeof planStatusLabels)[],
];
const goalStatuses = Object.keys(goalStatusLabels) as [
  keyof typeof goalStatusLabels,
  ...(keyof typeof goalStatusLabels)[],
];

const goalSchema = z.object({
  id: z.number().optional(),
  description: z.string().min(3, "Descreva a meta"),
  category: z.string().min(1, "Categoria"),
  target_criteria: z.string().min(3, "Critério de alcance"),
  current_progress: z.coerce.number().min(0).max(100),
  status: z.enum(goalStatuses),
});

const schema = z
  .object({
    patient_id: z.coerce.number({ message: "Selecione o paciente" }).int().positive(),
    professional_id: z.coerce
      .number({ message: "Selecione o profissional" })
      .int()
      .positive(),
    title: z.string().min(3, "Informe o título"),
    start_date: z.string().min(1, "Informe a data de início"),
    end_date: z.string().optional(),
    frequency: z.string().min(1, "Informe a frequência"),
    session_duration: z.coerce.number().int().positive("Duração inválida"),
    general_objective: z.string().min(5, "Descreva o objetivo geral"),
    status: z.enum(planStatuses),
    goals: z.array(goalSchema),
  })
  .refine((v) => !v.end_date || v.end_date >= v.start_date, {
    message: "O término deve ser posterior ao início",
    path: ["end_date"],
  });
type FormValues = z.infer<typeof schema>;

const emptyGoal: GoalInput = {
  description: "",
  category: GOAL_CATEGORIES[0],
  target_criteria: "",
  current_progress: 0,
  status: "em_andamento",
};

export default function PlanForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id && id !== "novo";
  const planId = isEdit ? Number(id) : undefined;

  const { data: patients } = usePatientOptions();
  const { data: professionals } = useProfessionalOptions();
  const { data: existing, isLoading } = usePlanWithGoals(planId);
  const savePlan = useSavePlan();

  const [deletedGoalIds, setDeletedGoalIds] = useState<number[]>([]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      patient_id: undefined as unknown as number,
      professional_id: undefined as unknown as number,
      title: "",
      start_date: "",
      end_date: "",
      frequency: "",
      session_duration: 50,
      general_objective: "",
      status: "ativo",
      goals: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "goals" });

  useEffect(() => {
    if (existing?.plan) {
      reset({
        patient_id: existing.plan.patient_id,
        professional_id: existing.plan.professional_id,
        title: existing.plan.title,
        start_date: existing.plan.start_date,
        end_date: existing.plan.end_date ?? "",
        frequency: existing.plan.frequency,
        session_duration: existing.plan.session_duration,
        general_objective: existing.plan.general_objective,
        status: existing.plan.status,
        goals: existing.goals.map((g) => ({
          id: g.id,
          description: g.description,
          category: g.category,
          target_criteria: g.target_criteria,
          current_progress: Number(g.current_progress),
          status: g.status,
        })),
      });
    }
  }, [existing, reset]);

  function removeGoal(index: number) {
    // Lê o id REAL do banco a partir dos valores do formulário —
    // fields[index].id é a key sintética do useFieldArray, não o id da meta.
    const dbId = getValues(`goals.${index}.id`);
    if (typeof dbId === "number") {
      setDeletedGoalIds((prev) => [...prev, dbId]);
    }
    remove(index);
  }

  async function onSubmit(values: FormValues) {
    try {
      await savePlan.mutateAsync({
        planId,
        plan: {
          patient_id: values.patient_id,
          professional_id: values.professional_id,
          title: values.title,
          start_date: values.start_date,
          end_date: values.end_date || null,
          frequency: values.frequency,
          session_duration: values.session_duration,
          general_objective: values.general_objective,
          status: values.status,
        },
        goals: values.goals,
        deletedGoalIds,
      });
      setDeletedGoalIds([]);
      toast.success(isEdit ? "Plano atualizado" : "Plano criado");
      navigate("/planos");
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
        title={isEdit ? "Editar plano" : "Novo plano terapêutico"}
        description="Plano Terapêutico Singular (PTS) e suas metas."
        actions={
          <Button variant="outline" onClick={() => navigate("/planos")}>
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dados do Plano</CardTitle>
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
            <Field label="Profissional Responsável" error={errors.professional_id?.message}>
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
            <Field label="Título do Plano" error={errors.title?.message} className="sm:col-span-2">
              <Input {...register("title")} placeholder="Ex: PTS - Terapia ABA - Comunicação Funcional" />
            </Field>
            <Field label="Data início" error={errors.start_date?.message}>
              <Controller
                control={control}
                name="start_date"
                render={({ field }) => (
                  <DatePicker
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="dd/mm/aaaa"
                  />
                )}
              />
            </Field>
            <Field label="Data fim (opcional)" error={errors.end_date?.message}>
              <Controller
                control={control}
                name="end_date"
                render={({ field }) => (
                  <DatePicker
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="dd/mm/aaaa"
                  />
                )}
              />
            </Field>
            <Field label="Frequência" error={errors.frequency?.message}>
              <Input {...register("frequency")} placeholder="Ex.: 2x por semana" />
            </Field>
            <Field label="Duração sessão (min)" error={errors.session_duration?.message}>
              <Input type="number" min={1} {...register("session_duration")} />
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
                        {Object.entries(planStatusLabels).map(([v, label]) => (
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
            <Field label="Objetivo geral do plano" error={errors.general_objective?.message} className="sm:col-span-2">
              <textarea
                {...register("general_objective")}
                rows={3}
                className="flex w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Descreva o objetivo geral do plano terapêutico. Ex: Desenvolver habilidades de comunicação funcional, ampliando o repertório verbal e a interação social em contextos naturais."
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Metas Terapêuticas</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append(emptyGoal)}
            >
              <Plus className="h-4 w-4" /> Adicionar Meta
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.length === 0 && (
              <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-10 text-center">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-secondary text-muted-foreground">
                  <Target className="h-5 w-5" />
                </span>
                <p className="text-sm text-muted-foreground">
                  Nenhuma meta. Adicione metas mensuráveis ao plano.
                </p>
              </div>
            )}

            {fields.map((fieldItem, index) => (
              <div
                key={fieldItem.id}
                className="rounded-xl border border-border bg-background/50 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-muted-foreground">
                    Meta {index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => removeGoal(index)}
                    aria-label="Remover meta"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field
                    label="Descrição da meta"
                    error={errors.goals?.[index]?.description?.message}
                    className="sm:col-span-2"
                  >
                    <Input
                      {...register(`goals.${index}.description`)}
                      placeholder="Ex: O paciente deverá solicitar itens desejados utilizando frases de 2 palavras de forma espontânea em pelo menos 3 contextos diferentes."
                    />
                  </Field>
                  <Field label="Categoria" error={errors.goals?.[index]?.category?.message}>
                    <Controller
                      control={control}
                      name={`goals.${index}.category`}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {GOAL_CATEGORIES.map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </Field>
                  <Field label="Status" error={errors.goals?.[index]?.status?.message}>
                    <Controller
                      control={control}
                      name={`goals.${index}.status`}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(goalStatusLabels).map(([v, label]) => (
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
                    label="Critério de aquisição"
                    error={errors.goals?.[index]?.target_criteria?.message}
                  >
                    <Input
                      {...register(`goals.${index}.target_criteria`)}
                      placeholder="Ex: 80% de acerto em 3 sessões consecutivas"
                    />
                  </Field>
                  <Field label="Progresso (%)" error={errors.goals?.[index]?.current_progress?.message}>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      {...register(`goals.${index}.current_progress`)}
                    />
                  </Field>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate("/planos")}>
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
