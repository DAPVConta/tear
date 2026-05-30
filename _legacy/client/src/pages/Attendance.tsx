import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, CheckCircle, XCircle, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const statusLabels: Record<string, string> = {
  presente: "Presente",
  falta_justificada: "Falta Justificada",
  falta_injustificada: "Falta Injustificada",
  cancelado_clinica: "Cancelado (Clínica)",
  cancelado_paciente: "Cancelado (Paciente)",
};

const statusColors: Record<string, string> = {
  presente: "bg-tea-green/10 text-tea-green border-tea-green/20",
  falta_justificada: "bg-tea-amber/10 text-tea-amber border-tea-amber/20",
  falta_injustificada: "bg-destructive/10 text-destructive border-destructive/20",
  cancelado_clinica: "bg-muted text-muted-foreground border-border",
  cancelado_paciente: "bg-muted text-muted-foreground border-border",
};

export default function AttendancePage() {
  const { data: patients } = trpc.patients.list.useQuery({});
  const { data: professionalsData } = trpc.professionals.list.useQuery({});
  const { data: authsData } = trpc.authorizations.list.useQuery({});
  const [selectedPatient, setSelectedPatient] = useState(0);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);

  // Form state for absence registration
  const [formPatientId, setFormPatientId] = useState(0);
  const [formProfessionalId, setFormProfessionalId] = useState(0);
  const [formAuthId, setFormAuthId] = useState(0);
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formStatus, setFormStatus] = useState<string>("");
  const [formJustification, setFormJustification] = useState("");

  const { data: records, isLoading, refetch } = trpc.attendance.list.useQuery(
    { patientId: selectedPatient || undefined, month, year },
    { enabled: true }
  );

  const registerAbsence = trpc.attendance.registerAbsence.useMutation({
    onSuccess: () => {
      toast.success("Registro de falta salvo com sucesso");
      setShowRegisterDialog(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  function resetForm() {
    setFormPatientId(0);
    setFormProfessionalId(0);
    setFormAuthId(0);
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormStatus("");
    setFormJustification("");
  }

  function handleSubmit() {
    if (!formPatientId || !formProfessionalId || !formAuthId || !formStatus) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    if (formStatus === "falta_justificada" && !formJustification.trim()) {
      toast.error("Justificativa é obrigatória para faltas justificadas");
      return;
    }
    registerAbsence.mutate({
      patientId: formPatientId,
      professionalId: formProfessionalId,
      authorizationId: formAuthId,
      sessionDate: formDate,
      status: formStatus as "falta_justificada" | "falta_injustificada" | "cancelado_clinica" | "cancelado_paciente",
      justification: formJustification || undefined,
    });
  }

  const totalPresent = records?.filter(r => r.status === "presente").length || 0;
  const totalAbsent = records?.filter(r => r.status !== "presente").length || 0;

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-tea-purple/15 to-tea-blue/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-tea-purple" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Controle de Frequência</h1>
            <p className="text-sm text-muted-foreground">Registro de presença e justificativas de faltas</p>
          </div>
        </div>
        <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
          <DialogTrigger asChild>
            <Button className="rounded-xl bg-gradient-to-r from-tea-purple to-tea-blue hover:opacity-90 text-white font-medium shadow-sm h-10">
              <Plus className="h-4 w-4 mr-1.5" />
              Registrar Falta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Registrar Falta / Cancelamento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Paciente *</Label>
                <Select value={String(formPatientId)} onValueChange={(v) => setFormPatientId(Number(v))}>
                  <SelectTrigger><SelectValue placeholder="Selecione o paciente" /></SelectTrigger>
                  <SelectContent>
                    {patients?.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Profissional *</Label>
                <Select value={String(formProfessionalId)} onValueChange={(v) => setFormProfessionalId(Number(v))}>
                  <SelectTrigger><SelectValue placeholder="Selecione o profissional" /></SelectTrigger>
                  <SelectContent>
                    {professionalsData?.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name} - {p.specialty}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Guia/Autorização *</Label>
                <Select value={String(formAuthId)} onValueChange={(v) => setFormAuthId(Number(v))}>
                  <SelectTrigger><SelectValue placeholder="Selecione a guia" /></SelectTrigger>
                  <SelectContent>
                    {authsData?.filter(a => !formPatientId || a.patientId === formPatientId).map((a) => (
                      <SelectItem key={a.id} value={String(a.id)}>Guia {a.guideNumber}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data da Sessão *</Label>
                <Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
              </div>
              <div>
                <Label>Status *</Label>
                <Select value={formStatus} onValueChange={setFormStatus}>
                  <SelectTrigger><SelectValue placeholder="Selecione o motivo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="falta_justificada">Falta Justificada</SelectItem>
                    <SelectItem value="falta_injustificada">Falta Injustificada</SelectItem>
                    <SelectItem value="cancelado_clinica">Cancelado pela Clínica</SelectItem>
                    <SelectItem value="cancelado_paciente">Cancelado pelo Paciente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formStatus === "falta_justificada" && (
                <div>
                  <Label>Justificativa *</Label>
                  <Textarea
                    value={formJustification}
                    onChange={(e) => setFormJustification(e.target.value)}
                    placeholder="Descreva o motivo da falta justificada (obrigatório)"
                    rows={3}
                  />
                </div>
              )}
              {(formStatus === "cancelado_clinica" || formStatus === "cancelado_paciente") && (
                <div>
                  <Label>Observação</Label>
                  <Textarea
                    value={formJustification}
                    onChange={(e) => setFormJustification(e.target.value)}
                    placeholder="Observação opcional sobre o cancelamento"
                    rows={2}
                  />
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowRegisterDialog(false)} className="rounded-xl">Cancelar</Button>
                <Button onClick={handleSubmit} disabled={registerAbsence.isPending} className="rounded-xl bg-gradient-to-r from-tea-purple to-tea-blue hover:opacity-90 text-white">
                  {registerAbsence.isPending ? "Salvando..." : "Registrar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <Card className="shadow-sm border-border/50">
        <CardContent className="pt-6">
          <div className="flex items-end gap-4 flex-wrap">
            <div>
              <Label>Paciente</Label>
              <Select value={String(selectedPatient)} onValueChange={(v) => setSelectedPatient(Number(v))}>
                <SelectTrigger className="w-60"><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Todos</SelectItem>
                  {patients?.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Mês</Label>
              <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      {new Date(2024, m-1).toLocaleString("pt-BR", { month: "long" })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ano</Label>
              <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026].map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="tea-stat-card shadow-sm border-border/50 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-tea-green/10 to-tea-teal/5 opacity-60" />
          <CardContent className="relative pt-5 pb-4 text-center">
            <p className="text-3xl font-bold text-tea-green tracking-tight">{totalPresent}</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mt-1">Presenças</p>
          </CardContent>
        </Card>
        <Card className="tea-stat-card shadow-sm border-border/50 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-destructive/8 to-tea-amber/5 opacity-60" />
          <CardContent className="relative pt-5 pb-4 text-center">
            <p className="text-3xl font-bold text-destructive tracking-tight">{totalAbsent}</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mt-1">Faltas/Cancelamentos</p>
          </CardContent>
        </Card>
        <Card className="tea-stat-card shadow-sm border-border/50 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-tea-blue/10 to-tea-purple/5 opacity-60" />
          <CardContent className="relative pt-5 pb-4 text-center">
            <p className="text-3xl font-bold text-tea-blue tracking-tight">{records?.length || 0}</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mt-1">Total de Registros</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela */}
      <Card className="shadow-sm border-border/50 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Registros de Frequência</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="tea-skeleton h-12 w-full" />)}
            </div>
          ) : !records || records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center mb-3">
                <Calendar className="w-7 h-7 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Nenhum registro encontrado para o período</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground/70 pl-5">Data</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground/70">Status</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground/70 hidden md:table-cell">Assinatura</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground/70">Justificativa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id} className="tea-table-row">
                      <TableCell className="pl-5 font-medium text-sm">
                        {new Date(record.sessionDate).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs font-semibold ${statusColors[record.status] || ""}`}>
                          {statusLabels[record.status] || record.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {record.guardianSignature ? (
                          <div className="flex items-center gap-1.5 text-tea-green">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-xs font-medium">Assinada</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-destructive">
                            <XCircle className="h-4 w-4" />
                            <span className="text-xs font-medium">Pendente</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm text-muted-foreground">{record.justification || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
