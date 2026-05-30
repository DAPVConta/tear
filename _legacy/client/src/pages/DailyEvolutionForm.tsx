import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, AlertTriangle, Shield, Info, Plus, X, Clock, Target, Brain, ClipboardList, UserCheck } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function DailyEvolutionFormPage() {
  const [, setLocation] = useLocation();

  const { data: patients } = trpc.patients.list.useQuery({});
  const { data: professionals } = trpc.professionals.list.useQuery({});

  const [patientId, setPatientId] = useState<string>("");
  const [professionalId, setProfessionalId] = useState<string>("");
  const [authorizationId, setAuthorizationId] = useState<string>("");
  const [planId, setPlanId] = useState<string>("");
  const [isPrivate, setIsPrivate] = useState(false);

  const [form, setForm] = useState({
    sessionDate: new Date().toISOString().split("T")[0],
    startTime: "",
    endTime: "",
    sessionDurationMinutes: 0,
    attendanceType: "individual_presencial",
    promptingLevel: "verbal",
    behavioralNotes: "",
    behavioralIntervention: "",
    sessionSummary: "",
    evolutionAssessment: "estavel",
    nextSessionPlan: "",
    incidents: "",
    guardianPresenceValidation: false,
    guardianValidationMethod: "presencial",
  });

  const [selectedGoals, setSelectedGoals] = useState<number[]>([]);
  const [skillsWorked, setSkillsWorked] = useState<Array<{
    goalId: number;
    skill: string;
    promptLevel: string;
    response: string;
    notes: string;
  }>>([]);

  const selectedPatient = useMemo(() => {
    if (!patientId || !patients) return null;
    return patients.find(p => p.id === Number(patientId)) || null;
  }, [patientId, patients]);

  useEffect(() => {
    if (selectedPatient) {
      const isPart = selectedPatient.paymentType === "particular";
      setIsPrivate(isPart);
      if (isPart) {
        setAuthorizationId("");
      }
    }
  }, [selectedPatient]);

  useEffect(() => {
    setPlanId("");
    setAuthorizationId("");
    setSelectedGoals([]);
  }, [patientId]);

  const { data: authorizations } = trpc.authorizations.getActive.useQuery(
    { patientId: Number(patientId), specialty: "" },
    { enabled: !!patientId && Number(patientId) > 0 && !isPrivate }
  );

  const { data: plans } = trpc.therapeuticPlans.getActive.useQuery(
    { patientId: Number(patientId) },
    { enabled: !!patientId && Number(patientId) > 0 }
  );

  const { data: goals } = trpc.therapeuticPlans.listGoals.useQuery(
    { planId: Number(planId) },
    { enabled: !!planId && Number(planId) > 0 }
  );

  useEffect(() => {
    if (form.startTime && form.endTime) {
      const [sh, sm] = form.startTime.split(":").map(Number);
      const [eh, em] = form.endTime.split(":").map(Number);
      const duration = (eh * 60 + em) - (sh * 60 + sm);
      setForm((f) => ({ ...f, sessionDurationMinutes: duration > 0 ? duration : 0 }));
    }
  }, [form.startTime, form.endTime]);

  const createMutation = trpc.dailyEvolutions.create.useMutation({
    onSuccess: () => {
      toast.success("Evolução registrada com sucesso!");
      setLocation("/evolucoes");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!patientId) { toast.error("Selecione um paciente"); return; }
    if (!professionalId) { toast.error("Selecione um profissional"); return; }
    if (!isPrivate && !authorizationId) { toast.error("Selecione uma guia de autorização (obrigatório para convênio)"); return; }
    if (skillsWorked.length === 0) { toast.error("Registre ao menos uma habilidade trabalhada"); return; }
    if (form.sessionDurationMinutes < 30) { toast.error("A duração mínima da sessão é de 30 minutos"); return; }
    if (!form.guardianPresenceValidation) { toast.error("A validação de presença do responsável é obrigatória"); return; }
    if (!form.sessionSummary || form.sessionSummary.length < 10) { toast.error("A síntese da sessão deve ter no mínimo 10 caracteres"); return; }

    createMutation.mutate({
      patientId: Number(patientId),
      professionalId: Number(professionalId),
      authorizationId: authorizationId ? Number(authorizationId) : null,
      planId: planId ? Number(planId) : null,
      isPrivate,
      sessionDate: form.sessionDate,
      startTime: form.startTime,
      endTime: form.endTime,
      sessionDurationMinutes: form.sessionDurationMinutes,
      attendanceType: form.attendanceType as any,
      promptingLevel: form.promptingLevel as any,
      evolutionAssessment: form.evolutionAssessment as any,
      guardianPresenceValidation: form.guardianPresenceValidation,
      guardianValidationMethod: form.guardianValidationMethod as any,
      goalsWorked: selectedGoals,
      skillsWorked: skillsWorked.map(s => ({
        ...s,
        promptLevel: s.promptLevel as any,
        notes: s.notes || undefined,
      })),
      sessionSummary: form.sessionSummary,
      nextSessionPlan: form.nextSessionPlan,
      behavioralNotes: form.behavioralNotes || undefined,
      behavioralIntervention: form.behavioralIntervention || undefined,
      incidents: form.incidents || undefined,
    });
  };

  const addSkill = () => {
    setSkillsWorked([...skillsWorked, {
      goalId: selectedGoals[0] || 0,
      skill: "",
      promptLevel: "verbal",
      response: "",
      notes: "",
    }]);
  };

  const removeSkill = (idx: number) => {
    setSkillsWorked(skillsWorked.filter((_, i) => i !== idx));
  };

  const sectionIcon = (icon: React.ReactNode, title: string) => (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-tea-blue/10 to-tea-purple/10 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <span className="font-semibold text-base">{title}</span>
    </div>
  );

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/evolucoes")} className="rounded-lg">
          <ArrowLeft className="h-4 w-4 mr-1.5" />Voltar
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-tea-blue/15 to-tea-purple/10 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-tea-blue" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Nova Evolução Diária</h1>
            <p className="text-xs text-muted-foreground">Campos com * são obrigatórios para blindagem de auditoria</p>
          </div>
        </div>
      </div>

      {/* Alerta de blindagem */}
      <div className="bg-tea-amber/5 border border-tea-amber/20 rounded-xl p-4 flex items-start gap-3">
        <Shield className="h-5 w-5 text-tea-amber mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold text-sm text-foreground">Regras de Blindagem Ativas</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Esta evolução será bloqueada para edição após 24h. Todos os campos obrigatórios devem ser preenchidos
            e a assinatura digital será registrada automaticamente ao salvar.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-5">
          {/* Dados da Sessão */}
          <Card className="shadow-sm border-border/50 overflow-hidden">
            <div className="h-0.5 bg-gradient-to-r from-tea-blue to-tea-purple" />
            <CardHeader className="pb-3">
              <CardTitle>{sectionIcon(<Clock className="h-4 w-4 text-tea-blue" />, "Dados da Sessão")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Paciente *</Label>
                  <Select value={patientId} onValueChange={setPatientId}>
                    <SelectTrigger className="rounded-lg"><SelectValue placeholder="Selecione o paciente" /></SelectTrigger>
                    <SelectContent>
                      {patients?.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.name} {p.paymentType === "particular" ? "(Particular)" : `(${p.healthPlanName})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Profissional *</Label>
                  <Select value={professionalId} onValueChange={setProfessionalId}>
                    <SelectTrigger className="rounded-lg"><SelectValue placeholder="Selecione o profissional" /></SelectTrigger>
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

              {/* Indicador Particular/Convênio */}
              {selectedPatient && (
                <div className={`flex items-start gap-3 rounded-xl p-3 border ${
                  isPrivate
                    ? "bg-tea-purple/5 border-tea-purple/20"
                    : "bg-tea-blue/5 border-tea-blue/20"
                }`}>
                  <Info className={`h-4 w-4 mt-0.5 shrink-0 ${isPrivate ? "text-tea-purple" : "text-tea-blue"}`} />
                  <p className="text-xs text-muted-foreground">
                    {isPrivate
                      ? "Paciente Particular — Não é necessário selecionar guia de autorização."
                      : `Paciente via Convênio (${selectedPatient.healthPlanName}) — Selecione a guia de autorização abaixo.`
                    }
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!isPrivate && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Guia/Autorização *</Label>
                    <Select value={authorizationId} onValueChange={setAuthorizationId}>
                      <SelectTrigger className="rounded-lg"><SelectValue placeholder="Selecione a guia" /></SelectTrigger>
                      <SelectContent>
                        {authorizations && authorizations.length > 0 ? (
                          authorizations.map((a) => (
                            <SelectItem key={a.id} value={String(a.id)}>
                              {a.guideNumber} - {a.procedureName} ({a.usedQuantity}/{a.authorizedQuantity})
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="__none" disabled>
                            {patientId ? "Nenhuma guia ativa encontrada" : "Selecione um paciente primeiro"}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {patientId && authorizations && authorizations.length === 0 && (
                      <p className="text-xs text-tea-amber flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Cadastre uma guia em "Guias TISS" antes de registrar a evolução
                      </p>
                    )}
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Plano Terapêutico (PTS)</Label>
                  <Select value={planId} onValueChange={setPlanId}>
                    <SelectTrigger className="rounded-lg"><SelectValue placeholder="Selecione o plano" /></SelectTrigger>
                    <SelectContent>
                      {plans && plans.length > 0 ? (
                        plans.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>{p.title}</SelectItem>
                        ))
                      ) : (
                        <SelectItem value="__none" disabled>
                          {patientId ? "Nenhum plano ativo encontrado" : "Selecione um paciente primeiro"}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {patientId && plans && plans.length === 0 && (
                    <p className="text-xs text-tea-amber flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Cadastre um plano em "Planos Terapêuticos" para vincular metas
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Data *</Label>
                  <Input type="date" value={form.sessionDate} onChange={(e) => setForm({ ...form, sessionDate: e.target.value })} required className="rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Hora Início *</Label>
                  <Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required className="rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Hora Fim *</Label>
                  <Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} required className="rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Duração</Label>
                  <div className={`h-9 flex items-center px-3 rounded-lg border text-sm font-mono ${
                    form.sessionDurationMinutes > 0 && form.sessionDurationMinutes < 30
                      ? "border-destructive/50 bg-destructive/5 text-destructive"
                      : "bg-muted/30 text-foreground"
                  }`}>
                    {form.sessionDurationMinutes} min
                  </div>
                  {form.sessionDurationMinutes > 0 && form.sessionDurationMinutes < 30 && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />Mínimo 30 min
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Tipo de Atendimento *</Label>
                <Select value={form.attendanceType} onValueChange={(v) => setForm({ ...form, attendanceType: v })}>
                  <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual_presencial">Individual - Presencial (Clínica)</SelectItem>
                    <SelectItem value="individual_domiciliar">Individual - Domiciliar (Home Care)</SelectItem>
                    <SelectItem value="individual_escolar">Individual - Escolar</SelectItem>
                    <SelectItem value="grupo_presencial">Grupo - Presencial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Objetivos e Habilidades */}
          <Card className="shadow-sm border-border/50 overflow-hidden">
            <div className="h-0.5 bg-gradient-to-r from-tea-green to-tea-teal" />
            <CardHeader className="pb-3">
              <CardTitle>{sectionIcon(<Target className="h-4 w-4 text-tea-green" />, "Habilidades Trabalhadas *")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {goals && goals.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Objetivos do PTS trabalhados nesta sessão</Label>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {goals.map((goal) => (
                      <div key={goal.id} className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-colors ${
                        selectedGoals.includes(goal.id) ? "border-tea-green/30 bg-tea-green/5" : "border-border/50"
                      }`}>
                        <Checkbox
                          checked={selectedGoals.includes(goal.id)}
                          onCheckedChange={(checked) => {
                            if (checked) setSelectedGoals([...selectedGoals, goal.id]);
                            else setSelectedGoals(selectedGoals.filter(g => g !== goal.id));
                          }}
                        />
                        <div className="text-sm">
                          <Badge variant="outline" className="text-[10px] mb-1 bg-tea-green/5 text-tea-green border-tea-green/20">{goal.category}</Badge>
                          <p className="text-muted-foreground">{goal.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!planId || !goals || goals.length === 0) && (
                <div className="bg-muted/30 border border-border/50 rounded-xl p-4 text-xs text-muted-foreground">
                  {!planId
                    ? "Selecione um plano terapêutico acima para ver as metas disponíveis. Você ainda pode registrar habilidades manualmente abaixo."
                    : "Nenhuma meta cadastrada neste plano. Registre as habilidades manualmente abaixo."
                  }
                </div>
              )}

              <div className="border-t border-border/50 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Registro de Habilidades e Nível de Suporte *</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addSkill} className="rounded-lg gap-1 text-xs">
                    <Plus className="h-3 w-3" /> Habilidade
                  </Button>
                </div>
                {skillsWorked.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    Clique em "+ Habilidade" para registrar as habilidades trabalhadas
                  </p>
                )}
                {skillsWorked.map((skill, idx) => (
                  <div key={idx} className="border border-border/50 rounded-xl p-3 mb-2.5 space-y-2 relative bg-muted/10">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-1.5 right-1.5 text-destructive h-6 w-6 p-0 rounded-lg"
                      onClick={() => removeSkill(idx)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Habilidade *</Label>
                        <Input value={skill.skill} onChange={(e) => {
                          const updated = [...skillsWorked];
                          updated[idx].skill = e.target.value;
                          setSkillsWorked(updated);
                        }} placeholder="Ex: Contato visual" className="rounded-lg text-sm h-8" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Prompting *</Label>
                        <Select value={skill.promptLevel} onValueChange={(v) => {
                          const updated = [...skillsWorked];
                          updated[idx].promptLevel = v;
                          setSkillsWorked(updated);
                        }}>
                          <SelectTrigger className="rounded-lg h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fisica_total">Física Total</SelectItem>
                            <SelectItem value="fisica_parcial">Física Parcial</SelectItem>
                            <SelectItem value="gestual">Gestual</SelectItem>
                            <SelectItem value="verbal">Verbal</SelectItem>
                            <SelectItem value="independente">Independente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Resposta *</Label>
                        <Input value={skill.response} onChange={(e) => {
                          const updated = [...skillsWorked];
                          updated[idx].response = e.target.value;
                          setSkillsWorked(updated);
                        }} placeholder="Ex: Realizou com ajuda" className="rounded-lg text-sm h-8" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Observações</Label>
                      <Input value={skill.notes} onChange={(e) => {
                        const updated = [...skillsWorked];
                        updated[idx].notes = e.target.value;
                        setSkillsWorked(updated);
                      }} placeholder="Observações adicionais (opcional)" className="rounded-lg text-sm h-8" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Nível de Suporte Geral da Sessão *</Label>
                <Select value={form.promptingLevel} onValueChange={(v) => setForm({ ...form, promptingLevel: v })}>
                  <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fisica_total">Física Total</SelectItem>
                    <SelectItem value="fisica_parcial">Física Parcial</SelectItem>
                    <SelectItem value="gestual">Gestual</SelectItem>
                    <SelectItem value="verbal">Verbal</SelectItem>
                    <SelectItem value="independente">Independente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Registro Comportamental */}
          <Card className="shadow-sm border-border/50 overflow-hidden">
            <div className="h-0.5 bg-gradient-to-r from-tea-amber to-tea-rose" />
            <CardHeader className="pb-3">
              <CardTitle>{sectionIcon(<Brain className="h-4 w-4 text-tea-amber" />, "Registro Comportamental")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Comportamentos Barreira Observados</Label>
                <Textarea value={form.behavioralNotes} onChange={(e) => setForm({ ...form, behavioralNotes: e.target.value })} rows={3} placeholder="Descreva comportamentos desafiadores observados durante a sessão..." className="rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Intervenções de Manejo Realizadas</Label>
                <Textarea value={form.behavioralIntervention} onChange={(e) => setForm({ ...form, behavioralIntervention: e.target.value })} rows={3} placeholder="Descreva as intervenções comportamentais aplicadas..." className="rounded-lg" />
              </div>
            </CardContent>
          </Card>

          {/* Síntese e Avaliação */}
          <Card className="shadow-sm border-border/50 overflow-hidden">
            <div className="h-0.5 bg-gradient-to-r from-tea-teal to-tea-blue" />
            <CardHeader className="pb-3">
              <CardTitle>{sectionIcon(<ClipboardList className="h-4 w-4 text-tea-teal" />, "Síntese da Sessão *")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Síntese/Observações Clínicas *</Label>
                <Textarea value={form.sessionSummary} onChange={(e) => setForm({ ...form, sessionSummary: e.target.value })} rows={4} required placeholder="Descreva detalhadamente o que foi trabalhado, respostas do paciente e observações relevantes..." className="rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Avaliação de Evolução *</Label>
                <Select value={form.evolutionAssessment} onValueChange={(v) => setForm({ ...form, evolutionAssessment: v })}>
                  <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="evolucao_significativa">Evolução Significativa</SelectItem>
                    <SelectItem value="evolucao_leve">Evolução Leve</SelectItem>
                    <SelectItem value="estavel">Estável</SelectItem>
                    <SelectItem value="retrocesso_leve">Retrocesso Leve</SelectItem>
                    <SelectItem value="retrocesso_significativo">Retrocesso Significativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Plano para Próxima Sessão *</Label>
                <Textarea value={form.nextSessionPlan} onChange={(e) => setForm({ ...form, nextSessionPlan: e.target.value })} rows={3} required placeholder="Descreva a conduta e plano para a próxima sessão..." className="rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Intercorrências</Label>
                <Textarea value={form.incidents} onChange={(e) => setForm({ ...form, incidents: e.target.value })} rows={2} placeholder="Registre intercorrências, se houver..." className="rounded-lg" />
              </div>
            </CardContent>
          </Card>

          {/* Validação de Presença */}
          <Card className="shadow-sm border-border/50 overflow-hidden">
            <div className="h-0.5 bg-gradient-to-r from-tea-purple to-tea-rose" />
            <CardHeader className="pb-3">
              <CardTitle>{sectionIcon(<UserCheck className="h-4 w-4 text-tea-purple" />, "Validação de Presença *")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-muted/10">
                <Checkbox
                  checked={form.guardianPresenceValidation}
                  onCheckedChange={(checked) => setForm({ ...form, guardianPresenceValidation: !!checked })}
                />
                <Label className="text-sm cursor-pointer">Confirmo a presença/validação do responsável pelo paciente</Label>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Método de Validação *</Label>
                <Select value={form.guardianValidationMethod} onValueChange={(v) => setForm({ ...form, guardianValidationMethod: v })}>
                  <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="assinatura_digital">Assinatura Digital</SelectItem>
                    <SelectItem value="token">Token de Validação</SelectItem>
                    <SelectItem value="presencial">Validação Presencial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {!form.guardianPresenceValidation && (
                <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                  <span className="text-xs text-destructive font-medium">A validação de presença é obrigatória para evitar glosas</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end mt-5 gap-3">
          <Button type="button" variant="outline" onClick={() => setLocation("/evolucoes")} className="rounded-xl">
            Cancelar
          </Button>
          <Button
            type="submit"
            className="rounded-xl bg-gradient-to-r from-tea-teal to-tea-green hover:opacity-90 text-white font-medium shadow-sm"
            disabled={createMutation.isPending}
          >
            <Save className="h-4 w-4 mr-1.5" />
            Salvar e Assinar Evolução
          </Button>
        </div>
      </form>
    </div>
  );
}
