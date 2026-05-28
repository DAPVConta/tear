import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, BookOpen, ChevronRight, Clock, CalendarDays } from "lucide-react";
import { useLocation } from "wouter";

export default function TherapeuticPlansPage() {
  const [, setLocation] = useLocation();
  const { data: plans, isLoading } = trpc.therapeuticPlans.list.useQuery({});

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-tea-green/15 to-tea-teal/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-tea-green" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Planos Terapêuticos (PTS)</h1>
            <p className="text-sm text-muted-foreground">
              {plans ? `${plans.length} plano${plans.length !== 1 ? "s" : ""} cadastrado${plans.length !== 1 ? "s" : ""}` : "Planos Terapêuticos Singulares com metas"}
            </p>
          </div>
        </div>
        <Button
          onClick={() => setLocation("/planos/novo")}
          className="rounded-xl bg-gradient-to-r from-tea-green to-tea-teal hover:opacity-90 text-white font-medium shadow-sm h-10"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Novo Plano
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
          ) : !plans || plans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
                <BookOpen className="w-8 h-8 text-muted-foreground/40" />
              </div>
              <p className="text-base font-medium text-muted-foreground">Nenhum plano cadastrado</p>
              <p className="text-sm text-muted-foreground/60 mt-1">Crie o primeiro plano terapêutico singular</p>
              <Button onClick={() => setLocation("/planos/novo")} variant="outline" className="mt-4 rounded-xl">
                <Plus className="h-4 w-4 mr-1.5" />
                Novo Plano
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground/70 pl-5">Título</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground/70">Frequência</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground/70 hidden md:table-cell">Duração</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground/70 hidden lg:table-cell">Início</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground/70">Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan) => (
                    <TableRow
                      key={plan.id}
                      className="tea-table-row cursor-pointer group"
                      onClick={() => setLocation(`/planos/${plan.id}`)}
                    >
                      <TableCell className="pl-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-tea-green/10 to-tea-teal/10 flex items-center justify-center shrink-0">
                            <BookOpen className="h-4 w-4 text-tea-green" />
                          </div>
                          <span className="font-semibold text-sm text-foreground">{plan.title}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{plan.frequency}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {plan.sessionDuration} min
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {new Date(plan.startDate).toLocaleDateString("pt-BR")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs font-semibold ${
                            plan.status === "ativo"
                              ? "bg-tea-green/10 text-tea-green border-tea-green/20"
                              : "bg-muted text-muted-foreground border-border"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            plan.status === "ativo" ? "bg-tea-green" : "bg-muted-foreground"
                          }`} />
                          {plan.status === "ativo" ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity rounded-lg h-8 w-8 p-0"
                          onClick={(e) => { e.stopPropagation(); setLocation(`/planos/${plan.id}`); }}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </TableCell>
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
