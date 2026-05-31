import { useUrlState } from "@/hooks/useUrlState";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  ScrollText,
  ChevronRight,
} from "lucide-react";
import { format, parseISO, subDays } from "date-fns";
import { PageHeader } from "@/components/layout/PageHeader";
import { DatePicker } from "@/components/ui/date-picker";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { usePatientOptions } from "@/features/patients/api";
import { BILLING_RULES } from "@/features/audit/checklist";
import {
  useBillingChecklist,
  useAuditLogs,
} from "@/features/audit/api";

export default function AuditDashboard() {
  const navigate = useNavigate();
  const [patientId, setPatientId] = useUrlState("patient", "all");
  const [from, setFrom] = useUrlState(
    "from",
    format(subDays(new Date(), 30), "yyyy-MM-dd"),
  );
  const [to, setTo] = useUrlState("to", format(new Date(), "yyyy-MM-dd"));

  const { data: patients } = usePatientOptions();
  const { data: checklist, isLoading } = useBillingChecklist({
    from,
    to,
    patientId: patientId === "all" ? undefined : Number(patientId),
  });
  const { data: logs, isLoading: logsLoading } = useAuditLogs({ from, to });

  return (
    <div>
      <PageHeader
        title="Auditoria"
        description="Checklist de faturamento e registro de auditoria."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <Select
          value={patientId}
          onValueChange={(v) => setPatientId(v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todos os pacientes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os pacientes</SelectItem>
            {patients?.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="sm:w-44">
          <DatePicker
            value={from}
            onChange={setFrom}
            placeholder="De"
            clearable={false}
          />
        </div>
        <div className="sm:w-44">
          <DatePicker
            value={to}
            onChange={setTo}
            placeholder="Até"
            clearable={false}
          />
        </div>
      </div>

      <Tabs defaultValue="checklist">
        <TabsList>
          <TabsTrigger value="checklist">
            <ShieldCheck className="mr-1 h-4 w-4" /> Checklist
          </TabsTrigger>
          <TabsTrigger value="logs">
            <ScrollText className="mr-1 h-4 w-4" /> Registro de auditoria
          </TabsTrigger>
        </TabsList>

        {/* Checklist tab */}
        <TabsContent value="checklist" className="space-y-6">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-28 rounded-2xl" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard
                  label="Sessões no período"
                  value={checklist?.summary.total ?? 0}
                  icon={ScrollText}
                  tone="primary"
                />
                <StatCard
                  label="Completas"
                  value={checklist?.summary.complete ?? 0}
                  icon={CheckCircle2}
                  tone="success"
                />
                <StatCard
                  label="Pendências"
                  value={checklist?.summary.incomplete ?? 0}
                  icon={AlertTriangle}
                  tone="warning"
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>
                    Conformidade ·{" "}
                    <span className="text-accent">
                      {checklist?.summary.completionRate ?? 0}%
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {BILLING_RULES.map((rule) => {
                    const fails = checklist?.summary.failuresByRule[rule.id] ?? 0;
                    const total = checklist?.summary.total ?? 0;
                    const pct = total === 0 ? 100 : Math.round(((total - fails) / total) * 100);
                    return (
                      <div
                        key={rule.id}
                        className="rounded-xl border border-border bg-background/50 p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold">{rule.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {rule.description}
                            </p>
                          </div>
                          <Badge
                            variant={
                              fails === 0
                                ? "success"
                                : fails / Math.max(total, 1) > 0.3
                                  ? "destructive"
                                  : "warning"
                            }
                          >
                            {pct}% ok
                          </Badge>
                        </div>
                        <Progress
                          value={pct}
                          tone={
                            fails === 0
                              ? "success"
                              : fails / Math.max(total, 1) > 0.3
                                ? "destructive"
                                : "warning"
                          }
                          className="mt-3"
                          aria-label={`Conformidade: ${pct}%`}
                        />
                        {fails > 0 && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            {fails} sessã{fails === 1 ? "o" : "es"} pendente
                            {fails === 1 ? "" : "s"}.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sessões com pendências</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Paciente</TableHead>
                        <TableHead>Profissional</TableHead>
                        <TableHead>Pendências</TableHead>
                        <TableHead className="w-12" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {checklist?.audits
                        .filter((a) => !a.isComplete)
                        .slice(0, 30)
                        .map((a) => (
                          <TableRow
                            key={a.evolution.id}
                            className="cursor-pointer"
                            onClick={() =>
                              navigate(`/evolucoes/${a.evolution.id}`)
                            }
                          >
                            <TableCell className="font-semibold">
                              {format(
                                parseISO(a.evolution.session_date),
                                "dd/MM/yyyy",
                              )}
                            </TableCell>
                            <TableCell>{a.patient?.name ?? "—"}</TableCell>
                            <TableCell>{a.professional?.name ?? "—"}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {a.failed.map((r) => (
                                  <Badge key={r.id} variant="warning">
                                    {r.label}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                  {!checklist?.audits.some((a) => !a.isComplete) && (
                    <div className="p-10 text-center text-sm text-muted-foreground">
                      Nenhuma sessão com pendências no período.
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Logs tab */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Últimos eventos de auditoria</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {logsLoading ? (
                <div className="p-6">
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : (logs?.length ?? 0) === 0 ? (
                <div className="p-10 text-center text-sm text-muted-foreground">
                  Sem eventos no período. Eventos serão registrados quando o
                  rastreamento server-side estiver ativo.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Quando</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Entidade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs?.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {format(parseISO(log.created_at), "dd/MM/yyyy HH:mm")}
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.user?.name || log.user?.email || "—"}
                        </TableCell>
                        <TableCell className="text-sm font-mono">
                          {log.action}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {log.table_name}
                          {log.record_id ? ` · #${log.record_id}` : ""}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: "primary" | "success" | "warning";
}) {
  const toneClass =
    tone === "success"
      ? "bg-emerald-500/10 text-emerald-600"
      : tone === "warning"
        ? "bg-warning/15 text-amber-600"
        : "bg-primary/10 text-primary";
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <span className={`grid h-11 w-11 place-items-center rounded-xl ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-4 text-3xl font-bold tabular-nums">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
