import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Building2,
  Plus,
  Search,
  Users,
  ShieldAlert,
  ArrowUpRight,
  Activity,
  Rocket,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import type { LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ListEmptyState,
  ListErrorBanner,
  TableSkeletonRows,
} from "@/components/ui/list-states";
import { useUrlState } from "@/hooks/useUrlState";
import {
  clinicPlanLabels,
  clinicPlanStatusLabels,
  clinicStatusLabels,
  clinicStatusVariant,
} from "@/lib/labels";
import { usePlatformClinics, type ClinicStatus } from "@/features/clinics/api";
import { cn } from "@/lib/utils";

// Trilho colorido da paleta TEA por situação — a coluna mais à esquerda dá
// leitura imediata do estado do contrato sem depender só do texto do badge.
const STATUS_RAIL: Record<ClinicStatus, string> = {
  em_implantacao: "#FFC400",
  ativa: "#1E88FF",
  suspensa: "#FF2D2D",
  encerrada: "#94A3B8",
};

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "todas", label: "Todas" },
  ...(Object.keys(clinicStatusLabels) as ClinicStatus[]).map((s) => ({
    value: s,
    label: clinicStatusLabels[s],
  })),
];

export default function ClinicsList() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = usePlatformClinics();
  const [search, setSearch] = useUrlState("q", "");
  const [status, setStatus] = useUrlState("status", "todas");

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data ?? []).filter((c) => {
      if (status !== "todas" && c.status !== status) return false;
      if (!term) return true;
      return [c.name, c.trade_name, c.cnpj, c.city, c.owner_name, c.owner_email]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term));
    });
  }, [data, search, status]);

  const totals = useMemo(() => {
    const all = data ?? [];
    return {
      clinics: all.length,
      ativas: all.filter((c) => c.status === "ativa").length,
      implantacao: all.filter((c) => c.status === "em_implantacao").length,
      semAdmin: all.filter((c) => c.admin_count === 0).length,
      pacientes: all.reduce((s, c) => s + c.patient_count, 0),
    };
  }, [data]);

  return (
    <div>
      <PageHeader
        title="Clínicas"
        description="Cadastro das clínicas da plataforma, situação do contrato e administradores."
        actions={
          <Button variant="brand" onClick={() => navigate("/clinicas/nova")}>
            <Plus className="h-4 w-4" /> Nova clínica
          </Button>
        }
      />

      <section className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat label="Clínicas" value={totals.clinics} icon={Building2} loading={isLoading} />
        <Stat label="Ativas" value={totals.ativas} icon={Activity} loading={isLoading} />
        <Stat
          label="Em implantação"
          value={totals.implantacao}
          icon={Rocket}
          loading={isLoading}
        />
        <Stat
          label="Sem administrador"
          value={totals.semAdmin}
          icon={ShieldAlert}
          loading={isLoading}
          alert={totals.semAdmin > 0}
        />
        <Stat label="Pacientes" value={totals.pacientes} icon={Users} loading={isLoading} />
      </section>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:max-w-xs sm:flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, CNPJ, cidade ou titular"
            className="pl-9"
            aria-label="Buscar clínicas"
          />
        </div>
        <div
          className="flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1"
          role="group"
          aria-label="Filtrar por situação"
        >
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatus(f.value)}
              aria-pressed={status === f.value}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                status === f.value
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1 p-0" aria-label="Situação" />
              <TableHead>Clínica</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Administrador titular</TableHead>
              <TableHead className="text-right">Membros</TableHead>
              <TableHead className="text-right">Pacientes</TableHead>
              <TableHead className="text-right">Sessões 30d</TableHead>
              <TableHead>Criada em</TableHead>
              <TableHead className="w-28" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableSkeletonRows rows={6} columns={10} />}
            {!isLoading &&
              rows.map((c) => (
                <TableRow key={c.id} className="group">
                  <TableCell className="p-0">
                    <span
                      className="block h-10 w-1 rounded-r"
                      style={{ background: STATUS_RAIL[c.status] }}
                      aria-hidden
                    />
                  </TableCell>
                  <TableCell>
                    <Link
                      to={`/clinicas/${c.id}`}
                      className="font-semibold hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {c.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {c.trade_name ? `${c.trade_name} · ` : ""}
                      <span className="font-mono">{c.cnpj}</span>
                      {c.city ? ` · ${c.city}/${c.state ?? ""}` : ""}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={clinicStatusVariant[c.status]}>
                      {clinicStatusLabels[c.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">
                      {clinicPlanLabels[c.plan]}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {clinicPlanStatusLabels[c.plan_status]}
                    </p>
                  </TableCell>
                  <TableCell>
                    {c.owner_name || c.owner_email ? (
                      <>
                        <span className="text-sm font-medium">
                          {c.owner_name ?? "—"}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {c.owner_email}
                        </p>
                      </>
                    ) : (
                      <Badge variant="warning">
                        <ShieldAlert className="h-3.5 w-3.5" /> Sem
                        administrador
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {c.member_count}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {c.patient_count}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {c.sessions_30d}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(parseISO(c.created_at), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/clinicas/${c.id}`}>
                        Gerenciar <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>

        {!isLoading && isError && (
          <ListErrorBanner message="Não foi possível carregar as clínicas." />
        )}
        {!isLoading && !isError && rows.length === 0 && (
          <ListEmptyState
            icon={Building2}
            title={
              (data?.length ?? 0) === 0
                ? "Nenhuma clínica cadastrada"
                : "Nenhuma clínica encontrada"
            }
            description={
              (data?.length ?? 0) === 0
                ? "Cadastre a primeira clínica e crie o administrador titular dela."
                : "Ajuste a busca ou o filtro de situação."
            }
            action={
              (data?.length ?? 0) === 0 ? (
                <Button variant="brand" onClick={() => navigate("/clinicas/nova")}>
                  <Plus className="h-4 w-4" /> Nova clínica
                </Button>
              ) : undefined
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
  alert,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  loading?: boolean;
  alert?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-card p-5 shadow-soft",
        alert ? "border-warning/40 bg-warning/5" : "border-border",
      )}
    >
      <span
        className={cn(
          "grid h-10 w-10 place-items-center rounded-xl shadow-soft",
          alert
            ? "bg-warning/20 text-warning-text"
            : "bg-primary text-primary-foreground",
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-3 text-2xl font-bold tabular-nums">
        {loading ? <Skeleton className="inline-block h-7 w-12" /> : value}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
