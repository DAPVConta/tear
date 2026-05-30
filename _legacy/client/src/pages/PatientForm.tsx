import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Info, User, ShieldCheck, CreditCard, Stethoscope } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { MaskedInput } from "@/components/MaskedInput";
import { maskCPF, maskPhone } from "@/lib/masks";

export default function PatientFormPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const isEditing = params.id && params.id !== "novo";

  const { data: patient } = trpc.patients.getById.useQuery(
    { id: Number(params.id) },
    { enabled: !!isEditing }
  );

  const [form, setForm] = useState({
    name: "",
    cpf: "",
    birthDate: "",
    gender: "masculino" as "masculino" | "feminino" | "outro",
    guardianName: "",
    guardianCpf: "",
    guardianPhone: "",
    guardianEmail: "",
    paymentType: "operadora" as "operadora" | "particular",
    healthPlanName: "",
    healthPlanCard: "",
    cid10Primary: "F84.0",
    cid10Secondary: "",
    diagnosis: "",
    address: "",
  });

  useEffect(() => {
    if (patient) {
      setForm({
        name: patient.name || "",
        cpf: patient.cpf ? maskCPF(patient.cpf) : "",
        birthDate: patient.birthDate ? String(patient.birthDate).split("T")[0] : "",
        gender: patient.gender || "masculino",
        guardianName: patient.guardianName || "",
        guardianCpf: patient.guardianCpf ? maskCPF(patient.guardianCpf) : "",
        guardianPhone: patient.guardianPhone ? maskPhone(patient.guardianPhone) : "",
        guardianEmail: patient.guardianEmail || "",
        paymentType: patient.paymentType || "operadora",
        healthPlanName: patient.healthPlanName || "",
        healthPlanCard: patient.healthPlanCard || "",
        cid10Primary: patient.cid10Primary || "F84.0",
        cid10Secondary: patient.cid10Secondary || "",
        diagnosis: patient.diagnosis || "",
        address: patient.address || "",
      });
    }
  }, [patient]);

  const createMutation = trpc.patients.create.useMutation({
    onSuccess: () => { toast.success("Paciente cadastrado com sucesso!"); setLocation("/pacientes"); },
    onError: (err) => {
      if (err.message.includes("Too small") || err.message.includes("too_small")) {
        toast.error("Preencha todos os campos obrigatórios corretamente.");
      } else {
        toast.error(err.message);
      }
    },
  });

  const updateMutation = trpc.patients.update.useMutation({
    onSuccess: () => { toast.success("Paciente atualizado!"); setLocation("/pacientes"); },
    onError: (err) => {
      if (err.message.includes("Too small") || err.message.includes("too_small")) {
        toast.error("Preencha todos os campos obrigatórios corretamente.");
      } else {
        toast.error(err.message);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isParticular = form.paymentType === "particular";
    const data = {
      ...form,
      cpf: form.cpf || undefined,
      guardianEmail: form.guardianEmail || "",
      cid10Secondary: form.cid10Secondary || "",
      diagnosis: form.diagnosis || "",
      address: form.address || "",
      healthPlanName: isParticular ? "Particular" : form.healthPlanName,
      healthPlanCard: isParticular ? "N/A" : form.healthPlanCard,
    };

    if (isEditing) {
      updateMutation.mutate({ id: Number(params.id), ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isParticular = form.paymentType === "particular";

  const sectionIcon = (icon: React.ReactNode, title: string) => (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-tea-blue/10 to-tea-purple/10 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <span className="font-semibold text-base">{title}</span>
    </div>
  );

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/pacientes")} className="rounded-lg">
          <ArrowLeft className="h-4 w-4 mr-1.5" />Voltar
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-tea-blue/15 to-tea-teal/10 flex items-center justify-center">
            <User className="w-5 h-5 text-tea-blue" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{isEditing ? "Editar Paciente" : "Novo Paciente"}</h1>
            <p className="text-xs text-muted-foreground">Campos com * são obrigatórios</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Dados do Paciente */}
          <Card className="shadow-sm border-border/50 overflow-hidden">
            <div className="h-0.5 bg-gradient-to-r from-tea-blue to-tea-teal" />
            <CardHeader className="pb-3">
              <CardTitle>{sectionIcon(<User className="h-4 w-4 text-tea-blue" />, "Dados do Paciente")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Nome Completo *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Nome completo do paciente" className="rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">CPF</Label>
                  <MaskedInput mask="cpf" value={form.cpf} onChange={(v) => setForm({ ...form, cpf: v })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Data de Nascimento *</Label>
                  <Input type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} required className="rounded-lg" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Gênero *</Label>
                <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v as typeof form.gender })}>
                  <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Diagnóstico TEA */}
          <Card className="shadow-sm border-border/50 overflow-hidden">
            <div className="h-0.5 bg-gradient-to-r from-tea-purple to-tea-rose" />
            <CardHeader className="pb-3">
              <CardTitle>{sectionIcon(<Stethoscope className="h-4 w-4 text-tea-purple" />, "Diagnóstico TEA")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">CID-10 Principal *</Label>
                  <Select value={form.cid10Primary} onValueChange={(v) => setForm({ ...form, cid10Primary: v })}>
                    <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="F84.0">F84.0 - Autismo Infantil</SelectItem>
                      <SelectItem value="F84.1">F84.1 - Autismo Atípico</SelectItem>
                      <SelectItem value="F84.2">F84.2 - Síndrome de Rett</SelectItem>
                      <SelectItem value="F84.3">F84.3 - Transt. Desintegrativo</SelectItem>
                      <SelectItem value="F84.4">F84.4 - Transt. com Hipercinesia</SelectItem>
                      <SelectItem value="F84.5">F84.5 - Síndrome de Asperger</SelectItem>
                      <SelectItem value="F84.8">F84.8 - Outros TGD</SelectItem>
                      <SelectItem value="F84.9">F84.9 - TGD Não Especificado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">CID-10 Secundário</Label>
                  <Input value={form.cid10Secondary} onChange={(e) => setForm({ ...form, cid10Secondary: e.target.value })} placeholder="Ex: F70, F90.0" className="rounded-lg" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Diagnóstico Complementar</Label>
                <Textarea value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} rows={2} placeholder="Detalhes do diagnóstico (opcional)" className="rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Endereço</Label>
                <Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} placeholder="Rua, número, bairro, cidade" className="rounded-lg" />
              </div>
            </CardContent>
          </Card>

          {/* Responsável */}
          <Card className="shadow-sm border-border/50 overflow-hidden">
            <div className="h-0.5 bg-gradient-to-r from-tea-green to-tea-teal" />
            <CardHeader className="pb-3">
              <CardTitle>{sectionIcon(<ShieldCheck className="h-4 w-4 text-tea-green" />, "Responsável Legal")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Nome do Responsável *</Label>
                <Input value={form.guardianName} onChange={(e) => setForm({ ...form, guardianName: e.target.value })} required placeholder="Nome completo do responsável" className="rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">CPF do Responsável *</Label>
                <MaskedInput mask="cpf" value={form.guardianCpf} onChange={(v) => setForm({ ...form, guardianCpf: v })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Telefone *</Label>
                  <MaskedInput mask="phone" value={form.guardianPhone} onChange={(v) => setForm({ ...form, guardianPhone: v })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">E-mail</Label>
                  <Input type="email" value={form.guardianEmail} onChange={(e) => setForm({ ...form, guardianEmail: e.target.value })} placeholder="email@exemplo.com" className="rounded-lg" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tipo de Pagamento */}
          <Card className="shadow-sm border-border/50 overflow-hidden">
            <div className="h-0.5 bg-gradient-to-r from-tea-amber to-tea-rose" />
            <CardHeader className="pb-3">
              <CardTitle>{sectionIcon(<CreditCard className="h-4 w-4 text-tea-amber" />, "Tipo de Atendimento")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Tipo de Pagamento *</Label>
                <Select value={form.paymentType} onValueChange={(v) => setForm({ ...form, paymentType: v as "operadora" | "particular" })}>
                  <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operadora">Operadora de Saúde (Convênio)</SelectItem>
                    <SelectItem value="particular">Particular</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {!isParticular && (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Nome do Plano de Saúde *</Label>
                    <Input value={form.healthPlanName} onChange={(e) => setForm({ ...form, healthPlanName: e.target.value })} required={!isParticular} placeholder="Ex: Unimed, Bradesco Saúde" className="rounded-lg" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Número da Carteirinha *</Label>
                    <Input value={form.healthPlanCard} onChange={(e) => setForm({ ...form, healthPlanCard: e.target.value })} required={!isParticular} placeholder="Número da carteirinha" className="rounded-lg" />
                  </div>
                </>
              )}

              {isParticular && (
                <div className="flex items-start gap-3 bg-tea-purple/5 border border-tea-purple/20 rounded-xl p-3">
                  <Info className="h-4 w-4 text-tea-purple mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground">Paciente Particular:</strong> Não é necessário cadastrar guia de autorização.
                    As evoluções diárias serão registradas sem vínculo com operadora.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end mt-5 gap-3">
          <Button type="button" variant="outline" onClick={() => setLocation("/pacientes")} className="rounded-xl">Cancelar</Button>
          <Button
            type="submit"
            className="rounded-xl bg-gradient-to-r from-tea-teal to-tea-green hover:opacity-90 text-white font-medium shadow-sm"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            <Save className="h-4 w-4 mr-1.5" />
            {isEditing ? "Salvar Alterações" : "Cadastrar Paciente"}
          </Button>
        </div>
      </form>
    </div>
  );
}
