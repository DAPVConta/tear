import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save } from "lucide-react";
import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";

export default function AuthorizationFormPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const isEditing = params.id && params.id !== "nova";

  const { data: patients } = trpc.patients.list.useQuery({});

  const [patientId, setPatientId] = useState<string>("");

  const [form, setForm] = useState({
    guideNumber: "",
    authorizationDate: "",
    expirationDate: "",
    procedureCode: "",
    procedureName: "",
    authorizedQuantity: 0,
    specialty: "psicologia_aba" as string,
    observations: "",
  });

  const createMutation = trpc.authorizations.create.useMutation({
    onSuccess: () => { toast.success("Guia cadastrada!"); setLocation("/guias"); },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) { toast.error("Selecione um paciente"); return; }
    createMutation.mutate({
      ...form,
      patientId: Number(patientId),
      specialty: form.specialty as any,
      observations: form.observations || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/guias")}>
          <ArrowLeft className="h-4 w-4 mr-2" />Voltar
        </Button>
        <h1 className="text-2xl font-bold">{isEditing ? "Editar Guia" : "Nova Guia"}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader><CardTitle>Dados da Guia TISS</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Paciente *</Label>
                <Select value={patientId} onValueChange={setPatientId}>
                  <SelectTrigger><SelectValue placeholder="Selecione o paciente" /></SelectTrigger>
                  <SelectContent>
                    {patients?.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Número da Guia *</Label>
                <Input value={form.guideNumber} onChange={(e) => setForm({ ...form, guideNumber: e.target.value })} required />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Data de Autorização *</Label>
                <Input type="date" value={form.authorizationDate} onChange={(e) => setForm({ ...form, authorizationDate: e.target.value })} required />
              </div>
              <div>
                <Label>Data de Validade *</Label>
                <Input type="date" value={form.expirationDate} onChange={(e) => setForm({ ...form, expirationDate: e.target.value })} required />
              </div>
              <div>
                <Label>Qtd Sessões Autorizadas *</Label>
                <Input type="number" value={form.authorizedQuantity} onChange={(e) => setForm({ ...form, authorizedQuantity: Number(e.target.value) })} required min={1} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Código do Procedimento *</Label>
                <Input value={form.procedureCode} onChange={(e) => setForm({ ...form, procedureCode: e.target.value })} required />
              </div>
              <div>
                <Label>Nome do Procedimento *</Label>
                <Input value={form.procedureName} onChange={(e) => setForm({ ...form, procedureName: e.target.value })} required />
              </div>
              <div>
                <Label>Especialidade *</Label>
                <Select value={form.specialty} onValueChange={(v) => setForm({ ...form, specialty: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="psicologia_aba">Psicologia (ABA)</SelectItem>
                    <SelectItem value="fonoaudiologia">Fonoaudiologia</SelectItem>
                    <SelectItem value="terapia_ocupacional_is">TO - Integração Sensorial (TO-IS)</SelectItem>
                    <SelectItem value="terapia_ocupacional_avds">TO - AVDs (TO-AVDs)</SelectItem>
                    <SelectItem value="fisioterapia">Fisioterapia</SelectItem>
                    <SelectItem value="psicopedagogia">Psicopedagogia</SelectItem>
                    <SelectItem value="musicoterapia">Musicoterapia</SelectItem>
                    <SelectItem value="neuropsicologia">Neuropsicologia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea value={form.observations} onChange={(e) => setForm({ ...form, observations: e.target.value })} rows={3} />
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end mt-6">
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={createMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />Cadastrar Guia
          </Button>
        </div>
      </form>
    </div>
  );
}
