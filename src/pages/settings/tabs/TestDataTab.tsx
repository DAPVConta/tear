import { useState } from "react";
import { toast } from "sonner";
import { Check, Copy, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Script de limpeza dos dados de teste populados na base (Clínica DAPV).
// Remove apenas os registros semeados, respeitando a ordem das chaves
// estrangeiras. Execute no SQL Editor do Supabase do projeto "tear".
const CLEANUP_SQL = `-- Remove os dados de teste (pacientes/profissionais semeados e seus vínculos).
do $$
declare
  pat_ids bigint[];
  prof_ids bigint[];
  plan_ids bigint[];
begin
  select array_agg(id) into pat_ids from patients
   where name in (
     'João Souza José','Maria Clara Oliveira',
     'Pedro Henrique Santos','Ana Beatriz Rocha'
   );
  select array_agg(id) into prof_ids from professionals
   where name in (
     'Fernanda Maria Souza','Carlos Eduardo Lima','Marina Alves Costa'
   );
  select array_agg(id) into plan_ids from therapeutic_plans
   where patient_id = any(pat_ids);

  delete from attendance_records   where patient_id = any(pat_ids);
  delete from daily_evolutions     where patient_id = any(pat_ids);
  delete from therapeutic_goals    where plan_id    = any(plan_ids);
  delete from monthly_evolutions   where patient_id = any(pat_ids);
  delete from therapeutic_plans    where patient_id = any(pat_ids);
  delete from authorizations       where patient_id = any(pat_ids);
  delete from patients             where id         = any(pat_ids);
  delete from professionals        where id         = any(prof_ids);
end $$;`;

export function TestDataTab() {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(CLEANUP_SQL);
      setCopied(true);
      toast.success("Script copiado");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar automaticamente. Selecione e copie manualmente.");
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-4 w-4 text-accent" /> Limpeza de dados de teste
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Use o script abaixo para remover os dados de teste semeados
            (profissionais, pacientes, guias, planos, metas, evoluções e
            frequência). Ele apaga somente esses registros, na ordem correta
            das dependências. Execute no{" "}
            <span className="font-medium text-foreground">SQL Editor</span> do
            Supabase (projeto <span className="font-medium text-foreground">tear</span>).
          </p>

          <div className="relative">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCopy}
              className="absolute right-2 top-2"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" /> Copiado
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" /> Copiar script
                </>
              )}
            </Button>
            <pre className="max-h-96 overflow-auto rounded-xl border border-border bg-muted/40 p-4 pt-12 text-xs leading-relaxed">
              <code>{CLEANUP_SQL}</code>
            </pre>
          </div>

          <div className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm text-amber-700">
            <p className="font-semibold">Atenção</p>
            <p className="mt-1 opacity-80">
              A remoção é definitiva. Rode apenas em ambiente de testes — não há
              desfazer.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
