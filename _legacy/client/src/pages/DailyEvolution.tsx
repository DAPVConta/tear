import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Lock, CheckCircle, ClipboardList, Clock, TrendingUp, TrendingDown, Minus, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";

const assessmentConfig: Record<string, { label: string; icon: any; className: string }> = {
  evolucao_significativa: { label: "Evolução Significativa", icon: TrendingUp, className: "bg-tea-green/10 text-tea-green border-tea-green/20" },
  evolucao_leve: { label: "Evolução Leve", icon: TrendingUp, className: "bg-tea-teal/10 text-tea-teal border-tea-teal/20" },
  estavel: { label: "Estável", icon: Minus, className: "bg-tea-blue/10 text-tea-blue border-tea-blue/20" },
  retrocesso_leve: { label: "Retrocesso Leve", icon: TrendingDown, className: "bg-tea-amber/10 text-tea-amber border-tea-amber/20" },
  retrocesso_significativo: { label: "Retrocesso Significativo", icon: TrendingDown, className: "bg-destructive/10 text-destructive border-destructive/20" },
};

const typeLabels: Record<string, string> = {
  presencial: "Presencial",
  teleconsulta: "Teleconsulta",
  domiciliar: "Domiciliar",
};

export default function DailyEvolutionPage() {
  const [, setLocation] = useLocation();
  const { data: evolutions, isLoading } = trpc.dailyEvolutions.list.useQuery({});

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-tea-blue/15 to-tea-purple/10 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-tea-blue" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Evoluções Diárias</h1>
            <p className="text-sm text-muted-foreground">
              {evolutions ? `${evolutions.length} evolução${evolutions.length !== 1 ? "ões" : ""} registrada${evolutions.length !== 1 ? "s" : ""}` : "Registro de evolução terapêutica por sessão"}
            </p>
          </div>
        </div>
        <Button
          onClick={() => setLocation("/evolucoes/nova")}
          className="rounded-xl bg-gradient-to-r from-tea-blue to-tea-purple hover:opacity-90 text-white font-medium shadow-sm h-10"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Nova Evolução
        </Button>
      </div>

      {/* Table */}
      <Card className="shadow-sm border-border/50 overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="tea-skeleton h-14 w-full" />
              ))}
            </div>
          ) : !evolutions || evolutions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
                <ClipboardList className="w-8 h-8 text-muted-foreground/40" />
              </div>
              <p className="text-base font-medium text-muted-foreground">Nenhuma evolução registrada</p>
              <p className="text-sm text-muted-foreground/60 mt-1">Registre a primeira evolução diária</p>
              <Button onClick={() => setLocation("/evolucoes/nova")} variant="outline" className="mt-4 rounded-xl">
                <Plus className="h-4 w-4 mr-1.5" />
                Nova Evolução
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground/70 pl-5">Data / Horário</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground/70">Tipo</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground/70">Avaliação</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground/70 hidden md:table-cell">Assinatura</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground/70">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {evolutions.map((ev) => {
                    const assessment = assessmentConfig[ev.evolutionAssessment] || assessmentConfig.estavel;
                    const AssessIcon = assessment.icon;
                    return (
                      <TableRow key={ev.id} className="tea-table-row group">
                        <TableCell className="pl-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-tea-blue/10 to-tea-purple/10 flex items-center justify-center shrink-0">
                              <ClipboardList className="h-4 w-4 text-tea-blue" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-foreground">
                                {new Date(ev.sessionDate).toLocaleDateString("pt-BR")}
                              </p>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {ev.startTime} - {ev.endTime}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {typeLabels[ev.attendanceType] || ev.attendanceType.replace(/_/g, " ")}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs font-semibold gap-1 ${assessment.className}`}>
                            <AssessIcon className="h-3 w-3" />
                            {assessment.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {ev.professionalSignature ? (
                            <div className="flex items-center gap-1.5 text-tea-green">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-xs font-medium">Assinada</span>
                            </div>
                          ) : (
                            <span className="text-xs font-medium text-destructive">Pendente</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {ev.locked ? (
                            <Badge variant="outline" className="gap-1 text-xs font-semibold bg-muted text-muted-foreground border-border">
                              <Lock className="h-3 w-3" />
                              Bloqueada
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1 text-xs font-semibold bg-tea-blue/5 text-tea-blue border-tea-blue/20">
                              Editável
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
