import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Users,
  ClipboardList,
  ShieldCheck,
  ArrowUpRight,
  Activity,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import type { LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ListEmptyState, ListErrorBanner } from "@/components/ui/list-states";
import { clinicStatusLabels, clinicStatusVariant } from "@/lib/labels";
import { usePlatformClinics } from "@/features/clinics/api";

// Painel consolidado da plataforma. A gestão do cadastro (criar clínica,
// mudar situação, criar administrador) vive no módulo Clínicas — aqui ficam
// apenas os números globais e o atalho para as clínicas mais recentes.
export default function SuperAdmin() {
  const { data, isLoading, isError } = usePlatformClinics();

  const totals = useMemo(() => {
    const rows = data ?? [];
    return {
      clinics: rows.length,
      activeClinics: rows.filter((r) => r.status === "ativa").length,
      members: rows.reduce((s, r) => s + r.member_count, 0),
      patients: rows.reduce((s, r) => s + r.patient_count, 0),
      sessions30d: rows.reduce((s, r) => s + r.sessions_30d, 0),
    };
  }, [data]);

  const recent = (data ?? []).slice(0, 5);

  return (
    <div>
      <PageHeader
        title="Super Admin"
        description="Visão consolidada da plataforma TEAR."
        actions={
          <div className="flex items-center gap-3">
            <Badge variant="default" className="px-3 py-1">
              <ShieldCheck className="h-4 w-4" /> Plataforma
            </Badge>
            <Button variant="brand" asChild>
              <Link to="/clinicas">
                <Building2 className="h-4 w-4" /> Gerenciar clínicas
              </Link>
            </Button>
          </div>
        }
      />

      <section className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        <Stat label="Clínicas" value={totals.clinics} icon={Building2} loading={isLoading} />
        <Stat
          label="Clínicas ativas"
          value={totals.activeClinics}
          icon={ShieldCheck}
          loading={isLoading}
        />
        <Stat label="Membros" value={totals.members} icon={Users} loading={isLoading} />
        <Stat label="Pacientes" value={totals.patients} icon={Users} loading={isLoading} />
        <Stat
          label="Sessões (30d)"
          value={totals.sessions30d}
          icon={ClipboardList}
          loading={isLoading}
        />
      </section>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-display font-bold tracking-tight">
            Clínicas recentes
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/clinicas">
              Ver todas <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Clínica</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead>Administrador titular</TableHead>
              <TableHead className="text-right">Pacientes</TableHead>
              <TableHead>Criada em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-3/4" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            {!isLoading &&
              recent.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link
                      to={`/clinicas/${c.id}`}
                      className="font-semibold hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {c.name}
                    </Link>
                    <p className="font-mono text-xs text-muted-foreground">
                      {c.cnpj}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={clinicStatusVariant[c.status]}>
                      {clinicStatusLabels[c.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {c.owner_name ?? (
                      <span className="text-muted-foreground">
                        Sem administrador
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {c.patient_count}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(parseISO(c.created_at), "dd/MM/yyyy")}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>

        {!isLoading && isError && (
          <ListErrorBanner message="Não foi possível carregar o painel." />
        )}
        {!isLoading && !isError && recent.length === 0 && (
          <ListEmptyState
            icon={Activity}
            title="Nenhuma clínica cadastrada"
            description="Cadastre a primeira clínica no módulo Clínicas."
            action={
              <Button variant="brand" asChild>
                <Link to="/clinicas/nova">
                  <Building2 className="h-4 w-4" /> Nova clínica
                </Link>
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
  loading,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  loading?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-soft">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-3 text-2xl font-bold tabular-nums">
        {loading ? <Skeleton className="inline-block h-7 w-12" /> : value}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
