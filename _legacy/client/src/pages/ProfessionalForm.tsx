import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, UserCog, Award, Phone } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { MaskedInput } from "@/components/MaskedInput";
import { maskCPF, maskPhone } from "@/lib/masks";

export default function ProfessionalFormPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const isEditing = params.id && params.id !== "novo";

  const { data: professional } = trpc.professionals.getById.useQuery(
    { id: Number(params.id) },
    { enabled: !!isEditing }
  );

  const [form, setForm] = useState({
    name: "",
    cpf: "",
    specialty: "psicologia_aba" as string,
    councilType: "",
    councilNumber: "",
    councilState: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    if (professional) {
      setForm({
        name: professional.name || "",
        cpf: professional.cpf ? maskCPF(professional.cpf) : "",
        specialty: professional.specialty || "psicologia_aba",
        councilType: professional.councilType || "",
        councilNumber: professional.councilNumber || "",
        councilState: professional.councilState || "",
        email: professional.email || "",
        phone: professional.phone ? maskPhone(professional.phone) : "",
      });
    }
  }, [professional]);

  const createMutation = trpc.professionals.create.useMutation({
    onSuccess: () => { toast.success("Profissional cadastrado!"); setLocation("/profissionais"); },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.professionals.update.useMutation({
    onSuccess: () => { toast.success("Profissional atualizado!"); setLocation("/profissionais"); },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...form,
      specialty: form.specialty as any,
      email: form.email || undefined,
      phone: form.phone || undefined,
    };
    if (isEditing) {
      updateMutation.mutate({ id: Number(params.id), ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const sectionIcon = (icon: React.ReactNode, title: string) => (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-tea-teal/10 to-tea-green/10 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <span className="font-semibold text-base">{title}</span>
    </div>
  );

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/profissionais")} className="rounded-lg">
          <ArrowLeft className="h-4 w-4 mr-1.5" />Voltar
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-tea-teal/15 to-tea-green/10 flex items-center justify-center">
            <UserCog className="w-5 h-5 text-tea-teal" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{isEditing ? "Editar Profissional" : "Novo Profissional"}</h1>
            <p className="text-xs text-muted-foreground">Campos com * são obrigatórios</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Dados Pessoais */}
        <Card className="shadow-sm border-border/50 overflow-hidden">
          <div className="h-0.5 bg-gradient-to-r from-tea-teal to-tea-green" />
          <CardHeader className="pb-3">
            <CardTitle>{sectionIcon(<UserCog className="h-4 w-4 text-tea-teal" />, "Dados Pessoais")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Nome Completo *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Nome completo do profissional" className="rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">CPF *</Label>
                <MaskedInput mask="cpf" value={form.cpf} onChange={(v) => setForm({ ...form, cpf: v })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Especialidade *</Label>
              <Select value={form.specialty} onValueChange={(v) => setForm({ ...form, specialty: v })}>
                <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="psicologia_aba">Psicologia (ABA)</SelectItem>
                  <SelectItem value="fonoaudiologia">Fonoaudiologia</SelectItem>
                  <SelectItem value="terapia_ocupacional_is">Terapia Ocupacional - Integração Sensorial (TO-IS)</SelectItem>
                  <SelectItem value="terapia_ocupacional_avds">Terapia Ocupacional - AVDs (TO-AVDs)</SelectItem>
                  <SelectItem value="fisioterapia">Fisioterapia</SelectItem>
                  <SelectItem value="psicopedagogia">Psicopedagogia</SelectItem>
                  <SelectItem value="musicoterapia">Musicoterapia</SelectItem>
                  <SelectItem value="neuropsicologia">Neuropsicologia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Registro Profissional */}
        <Card className="shadow-sm border-border/50 overflow-hidden">
          <div className="h-0.5 bg-gradient-to-r from-tea-blue to-tea-purple" />
          <CardHeader className="pb-3">
            <CardTitle>{sectionIcon(<Award className="h-4 w-4 text-tea-blue" />, "Registro Profissional")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Tipo de Conselho *</Label>
                <Input value={form.councilType} onChange={(e) => setForm({ ...form, councilType: e.target.value })} placeholder="CRP, CRFa, CREFITO..." required className="rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Número do Registro *</Label>
                <Input value={form.councilNumber} onChange={(e) => setForm({ ...form, councilNumber: e.target.value })} required placeholder="Ex: 06/12345" className="rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">UF do Conselho *</Label>
                <Input value={form.councilState} onChange={(e) => setForm({ ...form, councilState: e.target.value.toUpperCase() })} maxLength={2} placeholder="SP" required className="rounded-lg" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contato */}
        <Card className="shadow-sm border-border/50 overflow-hidden">
          <div className="h-0.5 bg-gradient-to-r from-tea-amber to-tea-rose" />
          <CardHeader className="pb-3">
            <CardTitle>{sectionIcon(<Phone className="h-4 w-4 text-tea-amber" />, "Contato")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Telefone</Label>
                <MaskedInput mask="phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">E-mail</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@exemplo.com" className="rounded-lg" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => setLocation("/profissionais")} className="rounded-xl">Cancelar</Button>
          <Button
            type="submit"
            className="rounded-xl bg-gradient-to-r from-tea-teal to-tea-green hover:opacity-90 text-white font-medium shadow-sm"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            <Save className="h-4 w-4 mr-1.5" />
            {isEditing ? "Salvar Alterações" : "Cadastrar Profissional"}
          </Button>
        </div>
      </form>
    </div>
  );
}
