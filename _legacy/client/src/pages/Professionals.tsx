import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, UserCog, Phone, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";

const specialtyLabels: Record<string, { label: string; abbr: string; className: string }> = {
  psicologia_aba: { label: "Psicologia - ABA", abbr: "ABA", className: "tea-badge-aba" },
  fonoaudiologia: { label: "Fonoaudiologia", abbr: "FONO", className: "tea-badge-fono" },
  terapia_ocupacional_is: { label: "TO - Integração Sensorial", abbr: "TO-IS", className: "tea-badge-to-is" },
  terapia_ocupacional_avds: { label: "TO - AVDs", abbr: "TO-AVDs", className: "tea-badge-to-avds" },
  fisioterapia: { label: "Fisioterapia", abbr: "FISIO", className: "tea-badge-fisio" },
  psicopedagogia: { label: "Psicopedagogia", abbr: "PSICO", className: "tea-badge-psico" },
  musicoterapia: { label: "Musicoterapia", abbr: "MUSIC", className: "tea-badge-music" },
  neuropsicologia: { label: "Neuropsicologia", abbr: "NEURO", className: "tea-badge-neuro" },
};

function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useMemo(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function ProfessionalsPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [, setLocation] = useLocation();
  const { data: professionals, isLoading } = trpc.professionals.list.useQuery({ search: debouncedSearch || undefined });

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-tea-purple/15 to-tea-blue/10 flex items-center justify-center">
            <UserCog className="w-5 h-5 text-tea-purple" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Profissionais</h1>
            <p className="text-sm text-muted-foreground">
              {professionals ? `${professionals.length} profissional${professionals.length !== 1 ? "is" : ""} cadastrado${professionals.length !== 1 ? "s" : ""}` : "Gerenciar equipe terapêutica"}
            </p>
          </div>
        </div>
        <Button
          onClick={() => setLocation("/profissionais/novo")}
          className="rounded-xl bg-gradient-to-r from-tea-purple to-tea-blue hover:opacity-90 text-white font-medium shadow-sm h-10"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Novo Profissional
        </Button>
      </div>

      {/* Search */}
      <Card className="shadow-sm border-border/50">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <Input
              placeholder="Buscar profissional por nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 rounded-xl border-border/60 bg-muted/30 focus:bg-background transition-colors"
            />
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
          ) : !professionals || professionals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
                <UserCog className="w-8 h-8 text-muted-foreground/40" />
              </div>
              <p className="text-base font-medium text-muted-foreground">Nenhum profissional encontrado</p>
              <p className="text-sm text-muted-foreground/60 mt-1">
                {search ? "Tente outro termo de busca" : "Cadastre o primeiro profissional"}
              </p>
              {!search && (
                <Button onClick={() => setLocation("/profissionais/novo")} variant="outline" className="mt-4 rounded-xl">
                  <Plus className="h-4 w-4 mr-1.5" />
                  Cadastrar Profissional
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground/70 pl-5">Profissional</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground/70">Especialidade</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground/70">Conselho</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground/70 hidden md:table-cell">Registro</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground/70 hidden lg:table-cell">Contato</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground/70 w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {professionals.map((prof) => {
                    const spec = specialtyLabels[prof.specialty] || { label: prof.specialty, abbr: "?", className: "" };
                    return (
                      <TableRow
                        key={prof.id}
                        className="tea-table-row cursor-pointer group"
                        onClick={() => setLocation(`/profissionais/${prof.id}`)}
                      >
                        <TableCell className="pl-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-tea-purple/10 to-tea-blue/10 flex items-center justify-center shrink-0">
                              <span className="text-sm font-bold text-tea-purple">{prof.name.charAt(0)}</span>
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-foreground">{prof.name}</p>
                              <p className="text-xs text-muted-foreground">{prof.email || ""}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${spec.className}`}>
                            {spec.abbr}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground font-medium">
                          {prof.councilType}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {prof.councilNumber}/{prof.councilState}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {prof.phone && (
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Phone className="h-3.5 w-3.5" />
                              {prof.phone}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity rounded-lg h-8 w-8 p-0"
                            onClick={(e) => { e.stopPropagation(); setLocation(`/profissionais/${prof.id}`); }}
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
