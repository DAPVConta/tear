import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { BarChart3, FileText, Loader2, CheckCircle, Download, Eye, X, CalendarDays } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { exportMonthlyEvolutionPDF } from "@/lib/pdfExport";

export default function MonthlyEvolutionPage() {
  const { data: patients } = trpc.patients.list.useQuery({});
  const { data: professionals } = trpc.professionals.list.useQuery({});

  const [selectedPatient, setSelectedPatient] = useState(0);
  const [selectedProfessional, setSelectedProfessional] = useState(0);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [generatedReport, setGeneratedReport] = useState<{ id: number; summary: string; totalSessions?: number; totalPresent?: number; totalAbsent?: number } | null>(null);
  const [review, setReview] = useState("");
  const [viewingReport, setViewingReport] = useState<any>(null);

  const generateMutation = trpc.monthlyEvolutions.generate.useMutation({
    onSuccess: (data) => {
      setGeneratedReport(data);
      toast.success("Evolução mensal gerada com sucesso!");
    },
    onError: (err) => toast.error(err.message),
  });

  const approveMutation = trpc.monthlyEvolutions.approve.useMutation({
    onSuccess: () => {
      toast.success("Evolução mensal aprovada!");
      setGeneratedReport(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const { data: existingReports } = trpc.monthlyEvolutions.list.useQuery(
    { patientId: selectedPatient || undefined },
    { enabled: selectedPatient > 0 }
  );

  const handleGenerate = () => {
    if (!selectedPatient || !selectedProfessional) {
      toast.error("Selecione paciente e profissional");
      return;
    }
    generateMutation.mutate({
      patientId: selectedPatient,
      professionalId: selectedProfessional,
      month,
      year,
    });
  };

  const handleApprove = () => {
    if (!generatedReport) return;
    approveMutation.mutate({
      id: generatedReport.id,
      professionalReview: review || undefined,
    });
  };

  const getPatientName = (id: number) => patients?.find(p => p.id === id)?.name || "Paciente";
  const getProfessionalName = (id: number) => professionals?.find(p => p.id === id)?.name || "Profissional";

  const handleExportPDF = (report: any) => {
    exportMonthlyEvolutionPDF({
      patientName: getPatientName(report.patientId || selectedPatient),
      professionalName: getProfessionalName(report.professionalId || selectedProfessional),
      month: report.referenceMonth || month,
      year: report.referenceYear || year,
      totalSessions: report.totalSessions || 0,
      totalPresent: report.totalPresent || 0,
      totalAbsent: report.totalAbsent || 0,
      summary: report.generatedSummary || report.summary || "",
      review: report.professionalReview || undefined,
      approved: report.approved || false,
    });
    toast.success("PDF exportado com sucesso!");
  };

  const handleExportCurrentPDF = () => {
    if (!generatedReport) return;
    exportMonthlyEvolutionPDF({
      patientName: getPatientName(selectedPatient),
      professionalName: getProfessionalName(selectedProfessional),
      month,
      year,
      totalSessions: generatedReport.totalSessions || 0,
      totalPresent: generatedReport.totalPresent || 0,
      totalAbsent: generatedReport.totalAbsent || 0,
      summary: generatedReport.summary,
      review: review || undefined,
      approved: false,
    });
    toast.success("PDF exportado com sucesso!");
  };

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-tea-teal/15 to-tea-green/10 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-tea-teal" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Evolução Mensal</h1>
          <p className="text-sm text-muted-foreground">
            Geração automática de relatório mensal baseado nas evoluções diárias
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card className="shadow-sm border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-tea-teal" />
            Gerar Relatório Mensal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Paciente *</Label>
              <Select value={String(selectedPatient)} onValueChange={(v) => setSelectedPatient(Number(v))}>
                <SelectTrigger className="rounded-lg"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {patients?.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Profissional *</Label>
              <Select value={String(selectedProfessional)} onValueChange={(v) => setSelectedProfessional(Number(v))}>
                <SelectTrigger className="rounded-lg"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {professionals?.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Mês *</Label>
              <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
                <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      {new Date(2024, m-1).toLocaleString("pt-BR", { month: "long" })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Ano *</Label>
              <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026].map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
            className="rounded-xl bg-gradient-to-r from-tea-teal to-tea-green hover:opacity-90 text-white font-medium shadow-sm h-10"
          >
            {generateMutation.isPending ? (
              <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Gerando com IA...</>
            ) : (
              <><FileText className="h-4 w-4 mr-1.5" />Gerar Evolução Mensal</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Relatório Gerado */}
      {generatedReport && (
        <Card className="shadow-sm border-tea-green/30 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-tea-teal to-tea-green" />
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-tea-green" />
                Relatório Gerado - {new Date(2024, month-1).toLocaleString("pt-BR", { month: "long" })}/{year}
              </span>
              <Button variant="outline" size="sm" onClick={handleExportCurrentPDF} className="rounded-lg gap-1.5">
                <Download className="h-3.5 w-3.5" />
                Exportar PDF
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Stats */}
            {(generatedReport.totalSessions || generatedReport.totalPresent || generatedReport.totalAbsent) && (
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-muted/40 p-3 text-center">
                  <p className="text-xl font-bold text-foreground">{generatedReport.totalSessions || 0}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Sessões</p>
                </div>
                <div className="rounded-xl bg-tea-green/10 p-3 text-center">
                  <p className="text-xl font-bold text-tea-green">{generatedReport.totalPresent || 0}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Presenças</p>
                </div>
                <div className="rounded-xl bg-destructive/8 p-3 text-center">
                  <p className="text-xl font-bold text-destructive">{generatedReport.totalAbsent || 0}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Faltas</p>
                </div>
              </div>
            )}
            <div className="prose prose-sm max-w-none bg-muted/30 p-4 rounded-xl border border-border/50">
              <Streamdown>{generatedReport.summary}</Streamdown>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Revisão do Profissional (opcional)</Label>
              <Textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows={4}
                placeholder="Adicione observações ou correções ao relatório gerado..."
                className="rounded-lg"
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleApprove}
                className="rounded-xl bg-gradient-to-r from-tea-green to-tea-teal hover:opacity-90 text-white font-medium"
                disabled={approveMutation.isPending}
              >
                <CheckCircle className="h-4 w-4 mr-1.5" />
                Aprovar e Assinar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Visualizar Relatório Existente */}
      {viewingReport && (
        <Card className="shadow-sm border-tea-blue/30 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-tea-blue to-tea-purple" />
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-base">
                <Eye className="h-4 w-4 text-tea-blue" />
                Relatório - {viewingReport.referenceMonth}/{viewingReport.referenceYear}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleExportPDF(viewingReport)} className="rounded-lg gap-1.5">
                  <Download className="h-3.5 w-3.5" />
                  PDF
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setViewingReport(null)} className="rounded-lg h-8 w-8 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="rounded-xl bg-muted/40 p-3 text-center">
                <p className="text-xl font-bold text-foreground">{viewingReport.totalSessions}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Sessões</p>
              </div>
              <div className="rounded-xl bg-tea-green/10 p-3 text-center">
                <p className="text-xl font-bold text-tea-green">{viewingReport.totalPresent}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Presenças</p>
              </div>
              <div className="rounded-xl bg-destructive/8 p-3 text-center">
                <p className="text-xl font-bold text-destructive">{viewingReport.totalAbsent}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Faltas</p>
              </div>
            </div>
            <div className="prose prose-sm max-w-none bg-muted/30 p-4 rounded-xl border border-border/50">
              <Streamdown>{viewingReport.generatedSummary}</Streamdown>
            </div>
            {viewingReport.professionalReview && (
              <div className="mt-4 bg-tea-blue/5 p-4 rounded-xl border border-tea-blue/20">
                <p className="text-xs font-semibold uppercase tracking-wider text-tea-blue mb-1.5">Revisão do Profissional:</p>
                <p className="text-sm text-foreground">{viewingReport.professionalReview}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Relatórios Existentes */}
      {existingReports && existingReports.length > 0 && (
        <Card className="shadow-sm border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4 text-tea-teal" />
              Relatórios Mensais Anteriores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {existingReports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-tea-teal/10 to-tea-green/10 flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-tea-teal" />
                    </div>
                    <div>
                      <span className="font-semibold text-sm">
                        {new Date(2024, (report.referenceMonth || 1) - 1).toLocaleString("pt-BR", { month: "long" })}/{report.referenceYear}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {report.totalSessions} sessões | {report.totalPresent} presenças
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-xs font-semibold ${
                        report.approved
                          ? "bg-tea-green/10 text-tea-green border-tea-green/20"
                          : "bg-tea-amber/10 text-tea-amber border-tea-amber/20"
                      }`}
                    >
                      {report.approved ? "Aprovado" : "Pendente"}
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => setViewingReport(report)} className="rounded-lg h-8 w-8 p-0">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleExportPDF(report)} className="rounded-lg h-8 w-8 p-0">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
