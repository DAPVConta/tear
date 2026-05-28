import { useMemo } from "react";
import {
  Building2,
  Users,
  ClipboardList,
  Activity,
  ShieldCheck,
  Power,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  usePlatformOverview,
  useToggleClinicActive,
  useUpdateClinicPlan,
  type PlatformClinicRow,
} from "@/features/superAdmin/api";
import type { Enums } from "@/types/database";

const planLabels: Record<Enums<"clinic_plan">, string> = {
  trial: "Trial",
  basic: "Basic",
  professional: "Professional",
  enterprise: "Enterprise",
};

const statusLabels: Record<Enums<"clinic_plan_status">, string> = {
  active: "Ativo",
  trialing: "Em trial",
  past_due: "Pendente",
  canceled: "Cancelado",
};

const statusVariant: Record<
  Enums<"clinic_plan_status">,
  "success" | "warning" | "destructive" | "muted"
> = {
  active: "success",
  trialing: "warning",
  past_due: "destructive",
  canceled: "muted",
};

export default function SuperAdmin() {
  const { data, isLoading, isError } = usePlatformOverview();
  const toggleActive = useToggleClinicActive();
  const updatePlan = useUpdateClinicPlan();

  const totals = useMemo(() => {
    const rows = data ?? [];
    return {
      clinics: rows.length,
      activeClinics: rows.filter((r) => r.active).length,
      members: rows.reduce((s, r) => s + r.member_count, 0),
      patients: rows.reduce((s, r) => s + r.patient_count, 0),
      sessions30d: rows.reduce((s, r) => s + r.sessions_30d, 0),
    };
  }, [data]);

  async function onToggle(c: PlatformClinicRow) {
    try {
      await toggleActive.mutateAsync({ id: c.id, active: !c.active });
      toast.success(c.active ? "Clínica desativada" : "Clínica ativada");
    } catch (e) {
      toast.error("Falha ao alterar", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

  async function onChangePlan(
    c: PlatformClinicRow,
    plan: Enums<"clinic_plan">,
  ) {
    try {
      await updatePlan.mutateAsync({ id: c.id, plan, plan_status: c.plan_status });
      toast.success("Plano atualizado");
    } catch (e) {
      toast.error("Falha", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

  async function onChangeStatus(
    c: PlatformClinicRow,
    plan_status: Enums<"clinic_plan_status">,
  ) {
    try {
      await updatePlan.mutateAsync({ id: c.id, plan: c.plan, plan_status });
      toast.success("Status atualizado");
    } catch (e) {
      toast.error("Falha", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

  return (
    <div>
      <PageHeader
        title="Super Admin"
        description="Gestão da plataforma TEAR e visão consolidada das clínicas."
        actions={
          <Badge variant="default" className="px-3 py-1">
            <ShieldCheck className="h-4 w-4" /> Plataforma
          </Badge>
        }
      />

      {/* Métricas globais */}
      <section className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        <Stat label="Clínicas" value={totals.clinics} icon={Building2} loading={isLoading} />
        <Stat
          label="Clínicas ativas"
          value={totals.activeClinics}
          icon={ShieldCheck}
          loading={isLoading}
        />
        <Stat label="Membros" value={totals.members} icon={Users} loading={isLoading} />
        <Stat
          label="Pacientes"
          value={totals.patients}
          icon={Users}
          loading={isLoading}
        />
        <Stat
          label="Sessões (30d)"
          value={totals.sessions30d}
          icon={ClipboardList}
          loading={isLoading}
        />
      </section>

      <div className="rounded-2xl border border-border bg-card shadow-soft">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Clínica</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Membros</TableHead>
              <TableHead className="text-right">Pacientes</TableHead>
              <TableHead className="text-right">Sessões 30d</TableHead>
              <TableHead>Criada em</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 9 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            {!isLoading &&
              data?.map((c) => (
                <TableRow key={c.id} className={c.active ? "" : "opacity-60"}>
                  <TableCell>
                    <div className="font-semibold">{c.name}</div>
                    {!c.active && (
                      <Badge variant="destructive" className="mt-1">
                        Inativa
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{c.cnpj}</TableCell>
                  <TableCell>
                    <Select
                      value={c.plan}
                      onValueChange={(v) =>
                        onChangePlan(c, v as Enums<"clinic_plan">)
                      }
                    >
                      <SelectTrigger className="h-9 w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(planLabels).map(([v, label]) => (
                          <SelectItem key={v} value={v}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={c.plan_status}
                      onValueChange={(v) =>
                        onChangeStatus(c, v as Enums<"clinic_plan_status">)
                      }
                    >
                      <SelectTrigger className="h-9 w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([v, label]) => (
                          <SelectItem key={v} value={v}>
                            <Badge
                              variant={
                                statusVariant[v as Enums<"clinic_plan_status">]
                              }
                            >
                              {label}
                            </Badge>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                  <TableCell>
                    <Button
                      variant={c.active ? "outline" : "brand"}
                      size="sm"
                      onClick={() => onToggle(c)}
                      disabled={toggleActive.isPending}
                    >
                      <Power className="h-4 w-4" />
                      {c.active ? "Desativar" : "Ativar"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>

        {!isLoading && isError && (
          <div className="p-10 text-center text-sm text-destructive">
            Não foi possível carregar o painel.
          </div>
        )}
        {!isLoading && !isError && (data?.length ?? 0) === 0 && (
          <div className="flex flex-col items-center gap-3 p-16 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-secondary text-muted-foreground">
              <Activity className="h-6 w-6" />
            </span>
            <p className="font-semibold">Nenhuma clínica cadastrada</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Assim que clínicas forem criadas, elas aparecerão aqui.
            </p>
          </div>
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
