import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, ChevronRight, AlertCircle, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useLocation } from "wouter";

const statusConfig: Record<string, { label: string; icon: any; className: string }> = {
  ativa: { label: "Ativa", icon: CheckCircle2, className: "bg-tea-green/10 text-tea-green border-tea-green/20" },
  vencida: { label: "Vencida", icon: AlertCircle, className: "bg-destructive/10 text-destructive border-destructive/20" },
  cancelada: { label: "Cancelada", icon: XCircle, className: "bg-muted text-muted-foreground border-border" },
  esgotada: { label: "Esgotada", icon: Clock, className: "bg-tea-amber/10 text-tea-amber border-tea-amber/20" },
};

export default function AuthorizationsPage() {
  const [, setLocation] = useLocation();
  const { data: auths, isLoading } = trpc.authorizations.list.useQuery({});

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-tea-amber/15 to-tea-rose/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-tea-amber" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Guias / Autorizações</h1>
            <p className="text-sm text-muted-foreground">
              {auths ? `${auths.length} guia${auths.length !== 1 ? "s" : ""} cadastrada${auths.length !== 1 ? "s" : ""}` : "Gestão de guias TISS e autorizações"}
            </p>
          </div>
        </div>
        <Button
          onClick={() => setLocation("/guias/nova")}
          className="rounded-xl bg-gradient-to-r from-tea-amber to-tea-rose hover:opacity-90 text-white font-medium shadow-sm h-10"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Nova Guia
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
          ) : !auths || auths.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-muted-foreground/40" />
              </div>
              <p className="text-base font-medium text-muted-foreground">Nenhuma guia cadastrada</p>
              <p className="text-sm text-muted-foreground/60 mt-1">Cadastre a primeira guia de autorização</p>
              <Button onClick={() => setLocation("/guias/nova")} variant="outline" className="mt-4 rounded-xl">
                <Plus className="h-4 w-4 mr-1.5" />
                Nova Guia
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground/70 pl-5">Nº Guia</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground/70">Procedimento</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground/70 hidden md:table-cell">Especialidade</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground/70 text-center">Uso</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground/70 hidden lg:table-cell">Validade</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground/70">Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auths.map((auth) => {
                    const status = statusConfig[auth.status] || statusConfig.ativa;
                    const StatusIcon = status.icon;
                    const usagePercent = auth.authorizedQuantity > 0 ? Math.round((auth.usedQuantity / auth.authorizedQuantity) * 100) : 0;
                    return (
                      <TableRow
                        key={auth.id}
                        className="tea-table-row cursor-pointer group"
                        onClick={() => setLocation(`/guias/${auth.id}`)}
                      >
                        <TableCell className="pl-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-tea-amber/10 to-tea-rose/10 flex items-center justify-center shrink-0">
                              <FileText className="h-4 w-4 text-tea-amber" />
                            </div>
                            <span className="font-semibold text-sm font-mono">{auth.guideNumber}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-medium text-foreground truncate max-w-[200px]">{auth.procedureName}</p>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {auth.specialty}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-xs font-semibold">{auth.usedQuantity}/{auth.authorizedQuantity}</span>
                            <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  usagePercent >= 90 ? "bg-destructive" : usagePercent >= 70 ? "bg-tea-amber" : "bg-tea-green"
                                }`}
                                style={{ width: `${Math.min(usagePercent, 100)}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                          {new Date(auth.expirationDate).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs font-semibold gap-1 ${status.className}`}>
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity rounded-lg h-8 w-8 p-0"
                            onClick={(e) => { e.stopPropagation(); setLocation(`/guias/${auth.id}`); }}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
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
