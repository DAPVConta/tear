import { useNavigate } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, CalendarDays, CalendarRange, Loader2, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
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
import { Field } from "@/components/form/Field";
import { cn } from "@/lib/utils";
import { todayLocalISO } from "@/lib/date";
import { usePatientOptions } from "@/features/patients/api";
import { useProfessionalOptions } from "@/features/professionals/api";
import {
  useGenerateMonthlyEvolution,
  MonthlyExistsError,
  MONTH_NAMES_PT,
  type GenerateInput,
  type MonthlyPeriodType,
} from "@/features/monthlyEvolutions/api";

const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth() + 1;
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

const schema = z
  .object({
    period_type: z.enum(["mensal", "periodo"]),
    patient_id: z.coerce.number({ message: "Selecione o paciente" }).int().positive(),
    professional_id: z.coerce
      .number({ message: "Selecione o profissional" })
      .int()
      .positive(),
    reference_month: z.coerce.number().int().min(1).max(12),
    reference_year: z.coerce.number().int().min(2000),
    period_start: z.string(),
    period_end: z.string(),
  })
  .superRefine((v, ctx) => {
    if (v.period_type !== "periodo") return;
    if (!v.period_start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["period_start"],
        message: "Informe a data inicial",
      });
    }
    if (!v.period_end) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["period_end"],
        message: "Informe a data final",
      });
    }
    if (v.period_start && v.period_end && v.period_end < v.period_start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["period_end"],
        message: "A data final deve ser igual ou posterior à inicial",
      });
    }
    // O relatório só agrega o que já aconteceu — período em aberto no futuro
    // produziria uma síntese vazia e sem valor clínico.
    if (v.period_end && v.period_end > todayLocalISO()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["period_end"],
        message: "A data final não pode ser futura",
      });
    }
  });
type FormValues = z.infer<typeof schema>;

const MODES: {
  value: MonthlyPeriodType;
  label: string;
  hint: string;
  icon: typeof CalendarDays;
}[] = [
  {
    value: "mensal",
    label: "Mensal",
    hint: "Mês de referência fechado",
    icon: CalendarDays,
  },
  {
    value: "periodo",
    label: "Por período",
    hint: "Intervalo livre de datas",
    icon: CalendarRange,
  },
];

const CLOSED_MSG =
  "Não é possível gerar a evolução mensal. O período selecionado deve contemplar um mês fechado (mínimo de 22 dias).";

export default function MonthlyGenerate() {
  const navigate = useNavigate();
  const { data: patients } = usePatientOptions();
  const { data: professionals } = useProfessionalOptions();
  const generate = useGenerateMonthlyEvolution();

  const {
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      period_type: "mensal",
      patient_id: undefined as unknown as number,
      professional_id: undefined as unknown as number,
      reference_month: currentMonth,
      reference_year: currentYear,
      period_start: "",
      period_end: "",
    },
  });

  const periodType = watch("period_type");
  const isRange = periodType === "periodo";

  // Trava de mês fechado (mínimo 22 dias): bloqueia meses futuros e o mês
  // corrente enquanto não acumular 22 dias corridos. Só vale para o recorte
  // mensal — no recorte por período o profissional escolhe as datas e a
  // validação é o intervalo não invadir o futuro.
  const selMonth = watch("reference_month");
  const selYear = watch("reference_year");
  const periodClosed = (() => {
    if (isRange) return true;
    if (selYear < currentYear) return true;
    if (selYear > currentYear) return false;
    if (selMonth < currentMonth) return true;
    if (selMonth > currentMonth) return false;
    return now.getDate() >= 22;
  })();

  async function onSubmit(values: FormValues) {
    if (!periodClosed) {
      toast.error(CLOSED_MSG);
      return;
    }
    const input: GenerateInput =
      values.period_type === "periodo"
        ? {
            patient_id: values.patient_id,
            professional_id: values.professional_id,
            period_type: "periodo",
            period_start: values.period_start,
            period_end: values.period_end,
          }
        : {
            patient_id: values.patient_id,
            professional_id: values.professional_id,
            period_type: "mensal",
            reference_month: values.reference_month,
            reference_year: values.reference_year,
          };
    try {
      const created = await generate.mutateAsync(input);
      toast.success("Síntese gerada");
      navigate(`/evolucao-mensal/${created.id}`);
    } catch (e) {
      if (e instanceof MonthlyExistsError) {
        toast.error("Evolução já existe", {
          description: e.message,
          action: e.existingId
            ? {
                label: "Abrir existente",
                onClick: () => navigate(`/evolucao-mensal/${e.existingId}`),
              }
            : undefined,
        });
        return;
      }
      toast.error("Não foi possível gerar", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

  return (
    <div>
      <PageHeader
        title="Gerar evolução"
        description="O motor agrega frequência, evoluções e metas do período."
        actions={
          <Button variant="outline" onClick={() => navigate("/evolucao-mensal")}>
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Recorte do relatório</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              role="radiogroup"
              aria-label="Recorte do relatório"
              className="grid gap-3 sm:grid-cols-2"
            >
              {MODES.map((mode) => {
                const active = periodType === mode.value;
                const Icon = mode.icon;
                return (
                  <button
                    key={mode.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() =>
                      setValue("period_type", mode.value, { shouldValidate: true })
                    }
                    className={cn(
                      "flex items-start gap-3 rounded-xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      active
                        ? "border-primary bg-primary/5 shadow-soft"
                        : "border-border bg-background hover:border-primary/40 hover:bg-secondary/40",
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-9 w-9 shrink-0 place-items-center rounded-lg transition-colors",
                        active
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">{mode.label}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {mode.hint}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Parâmetros</CardTitle>
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
            <Field label="Profissional responsável" error={errors.professional_id?.message}>
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

            {isRange ? (
              <>
                <Field label="Data inicial" error={errors.period_start?.message}>
                  <Controller
                    control={control}
                    name="period_start"
                    render={({ field }) => (
                      <DatePicker value={field.value} onChange={field.onChange} />
                    )}
                  />
                </Field>
                <Field label="Data final" error={errors.period_end?.message}>
                  <Controller
                    control={control}
                    name="period_end"
                    render={({ field }) => (
                      <DatePicker value={field.value} onChange={field.onChange} />
                    )}
                  />
                </Field>
              </>
            ) : (
              <>
                <Field label="Mês de referência" error={errors.reference_month?.message}>
                  <Controller
                    control={control}
                    name="reference_month"
                    render={({ field }) => (
                      <Select
                        value={String(field.value)}
                        onValueChange={(v) => field.onChange(Number(v))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MONTH_NAMES_PT.map((label, i) => (
                            <SelectItem key={label} value={String(i + 1)}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
                <Field label="Ano" error={errors.reference_year?.message}>
                  <Controller
                    control={control}
                    name="reference_year"
                    render={({ field }) => (
                      <Select
                        value={String(field.value)}
                        onValueChange={(v) => field.onChange(Number(v))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {YEARS.map((y) => (
                            <SelectItem key={y} value={String(y)}>
                              {y}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
              </>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center justify-end gap-3">
          {!periodClosed && (
            <p className="mr-auto max-w-md text-xs text-muted-foreground">
              {CLOSED_MSG}
            </p>
          )}
          <Button type="button" variant="outline" onClick={() => navigate("/evolucao-mensal")}>
            Cancelar
          </Button>
          <Button type="submit" variant="brand" disabled={isSubmitting || !periodClosed}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Gerar síntese
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
