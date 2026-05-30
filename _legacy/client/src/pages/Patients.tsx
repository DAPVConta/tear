import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Users, Phone, UserCheck, ChevronRight, ChevronLeft, Trash2 } from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const PAGE_SIZE = 20;

function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useMemo(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function PatientsPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [, setLocation] = useLocation();

  const { data, isLoading } = trpc.patients.listPaginated.useQuery({
    search: debouncedSearch || undefined,
    page,
    limit: PAGE_SIZE,
    paymentType: paymentFilter !== "all" ? paymentFilter as "operadora" | "particular" : undefined,
  });

  const utils = trpc.useUtils();

  const deactivateMutation = trpc.patients.deactivate.useMutation({
    onSuccess: () => {
      toast.success("Paciente desativado");
      utils.patients.listPaginated.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleDeactivate = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm("Deseja realmente desativar este paciente?")) return;
    deactivateMutation.mutate({ id });
  };

  const patients = data?.items || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 0;

  const paymentLabel = useCallback((type: string | null, planName: string | null) => {
    if (type === "particular") return { text: "Particular", className: "bg-tea-purple/10 text-tea-purple border-tea-purple/20" };
    return { text: planName || "Operadora", className: "bg-tea-blue/10 text-tea-blue border-tea-blue/20" };
  }, []);

  // Reset page when filters change
  const handleFilterChange = (value: string) => {
    setPaymentFilter(value);
    setPage(1);
  };

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-tea-teal/15 to-tea-green/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-tea-teal" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pacientes</h1>
            <p className="text-sm text-muted-foreground">
              {total} paciente{total !== 1 ? "s" : ""} cadastrado{total !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <Button
          onClick={() => setLocation("/pacientes/novo")}
          className="rounded-xl bg-gradient-to-r from-tea-blue to-tea-teal hover:opacity-90 text-white font-medium shadow-sm h-10"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Novo Paciente
        </Button>
      </div>

      {/* Search + Filters */}
      <Card className="shadow-sm border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
              <Input
                placeholder="Buscar paciente por nome..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-10 h-10 rounded-xl border-border/60 bg-muted/30 focus:bg-background transition-colors"
              />
            </div>
            <Select value={paymentFilter} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-44 rounded-xl h-10">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="operadora">Convênio</SelectItem>
                <SelectItem value="particular">Particular</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="shadow-sm border-border/50 overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="tea-skeleton h-14 w-full" />
              ))}
            </div>
          ) : patients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-muted-foreground/40" />
              </div>
              <p className="text-base font-medium text-muted-foreground">Nenhum paciente encontrado</p>
              <p className="text-sm text-muted-foreground/60 mt-1">
                {search ? "Tente outro termo de busca" : "Cadastre o primeiro paciente"}
              </p>
              {!search && (
                <Button onClick={() => setLocation("/pacientes/novo")} variant="outline" className="mt-4 rounded-xl">
                  <Plus className="h-4 w-4 mr-1.5" />Cadastrar Paciente
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground/70 pl-5">Paciente</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground/70">CID-10</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground/70">Tipo</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground/70 hidden md:table-cell">Responsável</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground/70 hidden lg:table-cell">Telefone</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground/70 w-24"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.map((patient) => {
                    const payment = paymentLabel(patient.paymentType, patient.healthPlanName);
                    return (
                      <TableRow
                        key={patient.id}
                        className="tea-table-row cursor-pointer group"
                        onClick={() => setLocation(`/pacientes/${patient.id}`)}
                      >
                        <TableCell className="pl-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-tea-teal/10 to-tea-blue/10 flex items-center justify-center shrink-0">
                              <span className="text-sm font-bold text-tea-teal">{patient.name.charAt(0)}</span>
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-foreground">{patient.name}</p>
                              <p className="text-xs text-muted-foreground">{patient.gender === "masculino" ? "M" : patient.gender === "feminino" ? "F" : "O"}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs border-tea-blue/20 text-tea-blue bg-tea-blue/5">
                            {patient.cid10Primary}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs font-medium ${payment.className}`}>
                            {payment.text}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <UserCheck className="h-3.5 w-3.5" />
                            <span className="truncate max-w-[150px]">{patient.guardianName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Phone className="h-3.5 w-3.5" />
                            {patient.guardianPhone}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity rounded-lg h-8 w-8 p-0 text-destructive hover:text-destructive"
                              onClick={(e) => handleDeactivate(e, patient.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity rounded-lg h-8 w-8 p-0"
                              onClick={(e) => { e.stopPropagation(); setLocation(`/pacientes/${patient.id}`); }}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Mostrando {((page - 1) * PAGE_SIZE) + 1}-{Math.min(page * PAGE_SIZE, total)} de {total}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) pageNum = i + 1;
              else if (page <= 3) pageNum = i + 1;
              else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
              else pageNum = page - 2 + i;
              return (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPage(pageNum)}
                  className={`rounded-lg h-8 w-8 p-0 text-xs ${page === pageNum ? "bg-tea-blue text-white" : ""}`}
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-lg h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
