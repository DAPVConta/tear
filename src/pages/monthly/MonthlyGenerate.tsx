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

  async function onSubmit(values: FormValues) {
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
                  <Select
                    value={field.value ? String(field.value) : ""}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients?.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="Profissional responsável" error={errors.professional_id?.message}>
              <Controller
                control={control}
                name="professional_id"
                render={({ field }) => (
                  <Select
                    value={field.value ? String(field.value) : ""}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {professionals?.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate("/evolucao-mensal")}>
            Cancelar
          </Button>
          <Button type="submit" variant="brand" disabled={isSubmitting}>
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
