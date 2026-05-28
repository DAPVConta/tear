import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, AlertTriangle, XCircle, AlertCircle, CheckCircle, Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { exportAuditPDF } from "@/lib/pdfExport";

const severityIcons: Record<string, React.ReactNode> = {
  critica: <XCircle className="h-4 w-4 text-destructive" />,
  alta: <AlertTriangle className="h-4 w-4 text-tea-amber" />,
  media: <AlertCircle className="h-4 w-4 text-tea-amber/70" />,
};

const severityLabels: Record<string, string> = {
  critica: "Crítica",
  alta: "Alta",
  media: "Média",
};

const severityColors: Record<string, string> = {
  critica: "bg-destructive/10 text-destructive border-destructive/20",
  alta: "bg-tea-amber/10 text-tea-amber border-tea-amber/20",
  media: "bg-tea-amber/5 text-tea-amber/80 border-tea-amber/15",
};

const typeLabels: Record<string, string> = {
  assinatura_ausente: "Assinatura Ausente",
  presenca_sem_evolucao: "Presença sem Evolução",
  falta_sem_justificativa: "Falta sem Justificativa",
  sem_validacao_responsavel: "Sem Validação Responsável",
  guia_vencida: "Guia Vencida",
  guia_vencendo: "Guia Próxima do Vencimento",
  carga_horaria_excedida: "Carga Horária Excedida",
  sem_plano_terapeutico: "Sem Plano Terapêutico",
  plano_desatualizado: "Plano Desatualizado",
  evolucao_mensal_pendente: "Evolução Mensal Pendente",
  evolucao_mensal_nao_aprovada: "Evolução Mensal Não Aprovada",
};

export default function AuditDashboardPage() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const { data: auditData, isLoading } = trpc.audit.billingChecklist.useQuery({ month, year });

  const summary = auditData?.summary as any;
  const billingChecks = (auditData as any)?.billingChecks as Array<{ item: string; status: boolean; detail: string }> | undefined;

  const handleExportPDF = () => {
    if (!auditData || !summary) {
      toast.error("Nenhum dado de auditoria disponível para exportar");
      return;
    }
    exportAuditPDF({
      month,
      year,
      summary: {
        totalIssues: summary.totalIssues || 0,
        critical: summary.critical || 0,
        high: summary.high || 0,
        medium: summary.medium || 0,
        billingReady: summary.billingReady || false,
      },
      billingChecks: billingChecks || [],
      issues: auditData.issues || [],
    });
    toast.success("PDF de auditoria exportado com sucesso!");
  };

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-tea-rose/15 to-tea-amber/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-tea-rose" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Painel de Auditoria</h1>
            <p className="text-sm text-muted-foreground">
              Checklist de compliance e verificação para faturamento
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleExportPDF}
          disabled={!auditData || isLoading}
          className="rounded-xl gap-1.5"
        >
          <Download className="h-4 w-4" />
          Exportar PDF
        </Button>
      </div>

      {/* Filtros */}
      <Card className="shadow-sm border-border/50">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-end gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Mês</Label>
              <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
                <SelectTrigger className="w-40 rounded-lg"><SelectValue /></SelectTrigger>
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
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Ano</Label>
              <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                <SelectTrigger className="w-32 rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026].map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="tea-stat-card shadow-sm border-border/50 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-muted/40 to-muted/20" />
            <CardContent className="relative pt-4 pb-3 text-center">
              <p className="text-2xl font-bold text-foreground tracking-tight">{summary.totalIssues}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mt-0.5">Total Pendências</p>
            </CardContent>
          </Card>
          <Card className="tea-stat-card shadow-sm border-border/50 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-destructive/8 to-destructive/3" />
            <CardContent className="relative pt-4 pb-3 text-center">
              <p className="text-2xl font-bold text-destructive tracking-tight">{summary.critical}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mt-0.5">Críticas</p>
            </CardContent>
          </Card>
          <Card className="tea-stat-card shadow-sm border-border/50 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-tea-amber/10 to-tea-amber/3" />
            <CardContent className="relative pt-4 pb-3 text-center">
              <p className="text-2xl font-bold text-tea-amber tracking-tight">{summary.high}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mt-0.5">Alta Prior.</p>
            </CardContent>
          </Card>
          <Card className="tea-stat-card shadow-sm border-border/50 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-tea-amber/5 to-muted/20" />
            <CardContent className="relative pt-4 pb-3 text-center">
              <p className="text-2xl font-bold text-tea-amber/80 tracking-tight">{summary.medium}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mt-0.5">Média Prior.</p>
            </CardContent>
          </Card>
          <Card className={`tea-stat-card shadow-sm overflow-hidden relative ${
            summary.billingReady ? "border-tea-green/30" : "border-destructive/30"
          }`}>
            <div className={`absolute inset-0 ${
              summary.billingReady ? "bg-gradient-to-br from-tea-green/10 to-tea-teal/5" : "bg-gradient-to-br from-destructive/8 to-tea-amber/5"
            }`} />
            <CardContent className="relative pt-4 pb-3 text-center">
              {summary.billingReady ? (
                <CheckCircle className="h-7 w-7 text-tea-green mx-auto" />
              ) : (
                <XCircle className="h-7 w-7 text-destructive mx-auto" />
              )}
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mt-1">
                {summary.billingReady ? "Pronto p/ Faturar" : "Pendências"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Checklist de Faturamento */}
      <Card className="shadow-sm border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle className="h-4 w-4 text-tea-teal" />
            Checklist de Faturamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="tea-skeleton h-12 w-full" />)}
            </div>
          ) : billingChecks && billingChecks.length > 0 ? (
            <div className="space-y-2">
              {billingChecks.map((check, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                    check.status ? "border-tea-green/20 bg-tea-green/5" : "border-destructive/20 bg-destructive/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {check.status ? (
                      <CheckCircle className="h-5 w-5 text-tea-green shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive shrink-0" />
                    )}
                    <span className={`text-sm font-medium ${check.status ? "text-foreground" : "text-destructive"}`}>
                      {check.item}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs font-semibold ${
                      check.status
                        ? "bg-tea-green/10 text-tea-green border-tea-green/20"
                        : "bg-destructive/10 text-destructive border-destructive/20"
                    }`}
                  >
                    {check.detail}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center mb-3">
                <Shield className="w-6 h-6 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status de Compliance */}
      {auditData && auditData.issues.length === 0 && (
        <Card className="shadow-sm border-tea-green/30 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-tea-green to-tea-teal" />
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-tea-green/10 flex items-center justify-center shrink-0">
                <CheckCircle className="h-6 w-6 text-tea-green" />
              </div>
              <div>
                <p className="font-bold text-foreground text-base">Documentação em Conformidade</p>
                <p className="text-sm text-muted-foreground">
                  Nenhuma pendência encontrada para o período. A documentação está pronta para faturamento.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Issues Table */}
      {auditData && auditData.issues.length > 0 && (
        <Card className="shadow-sm border-border/50 overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-tea-amber" />
              Pendências Identificadas ({auditData.issues.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground/70 pl-5">Severidade</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground/70">Tipo</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground/70">Descrição</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground/70 hidden md:table-cell">Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditData.issues.map((issue, idx) => (
                    <TableRow key={idx} className="tea-table-row">
                      <TableCell className="pl-5">
                        <div className="flex items-center gap-2">
                          {severityIcons[issue.severity]}
                          <Badge variant="outline" className={`text-xs font-semibold ${severityColors[issue.severity] || ""}`}>
                            {severityLabels[issue.severity] || issue.severity}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-sm">{typeLabels[issue.type] || issue.type}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{issue.message}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{issue.date || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
