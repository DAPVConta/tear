import { useNavigate } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
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
import { Field } from "@/components/form/Field";
import { usePatientOptions } from "@/features/patients/api";
import { useProfessionalOptions } from "@/features/professionals/api";
import {
  useGenerateMonthlyEvolution,
  MONTH_NAMES_PT,
} from "@/features/monthlyEvolutions/api";

const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth() + 1;
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

const schema = z.object({
  patient_id: z.coerce.number({ message: "Selecione o paciente" }).int().positive(),
  professional_id: z.coerce
    .number({ message: "Selecione o profissional" })
    .int()
    .positive(),
  reference_month: z.coerce.number().int().min(1).max(12),
  reference_year: z.coerce.number().int().min(2000),
});
type FormValues = z.infer<typeof schema>;

export default function MonthlyGenerate() {
  const navigate = useNavigate();
  const { data: patients } = usePatientOptions();
  const { data: professionals } = useProfessionalOptions();
  const generate = useGenerateMonthlyEvolution();

  const {
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      patient_id: undefined as unknown as number,
      professional_id: undefined as unknown as number,
      reference_month: currentMonth,
      reference_year: currentYear,
    },
  });

  // Trava de mês fechado (mínimo 22 dias): bloqueia meses futuros e o mês
  // corrente enquanto não acumular 22 dias corridos.
  const selMonth = watch("reference_month");
  const selYear = watch("reference_year");
  const periodClosed = (() => {
    if (selYear < currentYear) return true;
    if (selYear > currentYear) return false;
    if (selMonth < currentMonth) return true;
    if (selMonth > currentMonth) return false;
    return now.getDate() >= 22;
  })();
  const CLOSED_MSG =
    "Não é possível gerar a evolução mensal. O período selecionado deve contemplar um mês fechado (mínimo de 22 dias).";

  async function onSubmit(values: FormValues) {
    if (!periodClosed) {
      toast.error(CLOSED_MSG);
      return;
    }
    try {
      const created = await generate.mutateAsync(values);
      toast.success("Síntese gerada");
      navigate(`/evolucao-mensal/${created.id}`);
    } catch (e) {
      toast.error("Não foi possível gerar", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

  return (
    <div>
      <PageHeader
        title="Gerar evolução mensal"
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
