import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Plus, Trash2, Info } from "lucide-react";
import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";

export default function TherapeuticPlanFormPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const isEditing = params.id && params.id !== "novo";

  const { data: patients } = trpc.patients.list.useQuery({});
  const { data: professionals } = trpc.professionals.list.useQuery({});

  const [patientId, setPatientId] = useState<string>("");
  const [professionalId, setProfessionalId] = useState<string>("");

  const [form, setForm] = useState({
    title: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    frequency: "",
    sessionDuration: 40,
    generalObjective: "",
  });

  const [goals, setGoals] = useState<Array<{ description: string; category: string; targetCriteria: string }>>([]);

  const createPlanMutation = trpc.therapeuticPlans.create.useMutation({
    onSuccess: async (data) => {
      for (const goal of goals) {
        if (goal.description && goal.category && goal.targetCriteria) {
          await createGoalMutation.mutateAsync({ planId: data.id, ...goal });
        }
      }
      toast.success("Plano terapêutico criado com sucesso!");
      setLocation("/planos");
    },
    onError: (err) => toast.error(err.message),
  });

  const createGoalMutation = trpc.therapeuticPlans.createGoal.useMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) { toast.error("Selecione um paciente"); return; }
    if (!professionalId) { toast.error("Selecione um profissional"); return; }
    if (!form.title || form.title.length < 3) { toast.error("Informe o título do plano (mínimo 3 caracteres)"); return; }
    if (!form.generalObjective || form.generalObjective.length < 10) { toast.error("Descreva o objetivo geral (mínimo 10 caracteres)"); return; }
    createPlanMutation.mutate({
      ...form,
      patientId: Number(patientId),
      professionalId: Number(professionalId),
      endDate: form.endDate || undefined,
    });
  };

  const addGoal = () => {
    setGoals([...goals, { description: "", category: "", targetCriteria: "" }]);
  };

  const removeGoal = (idx: number) => {
    setGoals(goals.filter((_, i) => i !== idx));
  };

  const updateGoal = (idx: number, field: string, value: string) => {
    const updated = [...goals];
    (updated[idx] as any)[field] = value;
    setGoals(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/planos")}>
          <ArrowLeft className="h-4 w-4 mr-2" />Voltar
        </Button>
        <h1 className="text-2xl font-bold">{isEditing ? "Editar Plano" : "Novo Plano Terapêutico Singular (PTS)"}</h1>
      </div>

      {/* Dica informativa */}
      <div className="flex items-start gap-3 rounded-lg p-4 border bg-blue-50 border-blue-200">
        <Info className="h-5 w-5 mt-0.5 shrink-0 text-blue-600" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">O que é o Plano Terapêutico Singular (PTS)?</p>
          <p>É o documento que define os objetivos, metas e estratégias de intervenção para cada paciente. Cada profissional cria seu PTS com as metas específicas da sua especialidade. As evoluções diárias serão vinculadas a este plano.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados do Plano</CardTitle>
              <CardDescription>Preencha as informações do plano terapêutico. O título deve identificar claramente a especialidade e o foco do tratamento.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Paciente *</Label>
                  <Select value={patientId} onValueChange={setPatientId}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Selecione o paciente" /></SelectTrigger>
                    <SelectContent>
                      {patients?.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.name} {p.paymentType === "particular" ? "(Particular)" : `(${p.healthPlanName || "Convênio"})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Profissional Responsável *</Label>
                  <Select value={professionalId} onValueChange={setProfessionalId}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Selecione o profissional" /></SelectTrigger>
                    <SelectContent>
                      {professionals?.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.name} - {p.specialty.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Título do Plano *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ex: PTS - Terapia ABA - Comunicação Funcional"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Exemplos: "PTS - Fonoaudiologia - Linguagem Expressiva", "PTS - TO Integração Sensorial", "PTS - ABA Comportamento Social"
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Data Início *</Label>
                  <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
                </div>
                <div>
                  <Label>Data Fim (opcional)</Label>
                  <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                </div>
                <div>
                  <Label>Frequência *</Label>
                  <Input value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} placeholder="Ex: 2x por semana" required />
                </div>
                <div>
                  <Label>Duração Sessão (min) *</Label>
                  <Input type="number" value={form.sessionDuration} onChange={(e) => setForm({ ...form, sessionDuration: Number(e.target.value) })} min={15} required />
                </div>
              </div>
              <div>
                <Label>Objetivo Geral do Plano *</Label>
                <Textarea
                  value={form.generalObjective}
                  onChange={(e) => setForm({ ...form, generalObjective: e.target.value })}
                  placeholder="Descreva o objetivo geral do plano terapêutico. Ex: Desenvolver habilidades de comunicação funcional, ampliando o repertório verbal e a interação social em contextos naturais."
                  required
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Metas Terapêuticas</CardTitle>
                  <CardDescription>Adicione as metas específicas que serão trabalhadas nas sessões. Cada meta será vinculada às evoluções diárias.</CardDescription>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addGoal}>
                  <Plus className="h-4 w-4 mr-2" />Adicionar Meta
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {goals.length === 0 && (
                <div className="text-center py-6 border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground mb-2">Nenhuma meta adicionada ainda</p>
                  <p className="text-xs text-muted-foreground mb-3">Clique em "Adicionar Meta" para definir os objetivos específicos do plano</p>
                  <Button type="button" variant="outline" size="sm" onClick={addGoal}>
                    <Plus className="h-4 w-4 mr-2" />Adicionar Primeira Meta
                  </Button>
                </div>
              )}
              {goals.map((goal, idx) => (
                <div key={idx} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">Meta {idx + 1}</span>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeGoal(idx)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Categoria *</Label>
                      <Select value={goal.category} onValueChange={(v) => updateGoal(idx, "category", v)}>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Selecione a categoria" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="comunicacao">Comunicação</SelectItem>
                          <SelectItem value="social">Habilidades Sociais</SelectItem>
                          <SelectItem value="motor">Desenvolvimento Motor</SelectItem>
                          <SelectItem value="cognitivo">Cognitivo</SelectItem>
                          <SelectItem value="comportamental">Comportamental</SelectItem>
                          <SelectItem value="autocuidado">Autocuidado / AVDs</SelectItem>
                          <SelectItem value="sensorial">Processamento Sensorial</SelectItem>
                          <SelectItem value="linguagem">Linguagem</SelectItem>
                          <SelectItem value="alimentacao">Alimentação</SelectItem>
                          <SelectItem value="academico">Acadêmico</SelectItem>
                          <SelectItem value="brincar">Brincar Funcional</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Critério de Aquisição *</Label>
                      <Input
                        value={goal.targetCriteria}
                        onChange={(e) => updateGoal(idx, "targetCriteria", e.target.value)}
                        placeholder="Ex: 80% de acerto em 3 sessões consecutivas"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Descrição da Meta *</Label>
                    <Textarea
                      value={goal.description}
                      onChange={(e) => updateGoal(idx, "description", e.target.value)}
                      placeholder="Ex: O paciente deverá solicitar itens desejados utilizando frases de 2 palavras de forma espontânea em pelo menos 3 contextos diferentes."
                      rows={2}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end mt-6">
          <Button type="submit" className="bg-teal-600 hover:bg-teal-700" disabled={createPlanMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />{createPlanMutation.isPending ? "Salvando..." : "Criar Plano Terapêutico"}
          </Button>
        </div>
      </form>
    </div>
  );
}
