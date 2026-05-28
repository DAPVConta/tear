import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useState } from "react";
import {
  Building2, Users, UserCheck, FileText, DollarSign,
  TrendingUp, Search, Shield, ToggleLeft, ToggleRight,
  ChevronRight, Activity, Crown, ArrowLeft
} from "lucide-react";
import { Link } from "wouter";

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

function PlanBadge({ plan }: { plan: string }) {
  const colors: Record<string, string> = {
    trial: "bg-gray-100 text-gray-700",
    basic: "bg-blue-100 text-blue-700",
    professional: "bg-indigo-100 text-indigo-700",
    enterprise: "bg-purple-100 text-purple-700",
  };
  return <Badge className={colors[plan] || "bg-gray-100 text-gray-700"}>{plan}</Badge>;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    trialing: "bg-blue-100 text-blue-700",
    past_due: "bg-yellow-100 text-yellow-700",
    canceled: "bg-red-100 text-red-700",
  };
  const labels: Record<string, string> = {
    active: "Ativo",
    trialing: "Trial",
    past_due: "Pendente",
    canceled: "Cancelado",
  };
  return <Badge className={colors[status] || "bg-gray-100 text-gray-700"}>{labels[status] || status}</Badge>;
}

export default function SuperAdmin() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedClinic, setSelectedClinic] = useState<number | null>(null);

  const { data: stats } = trpc.superAdmin.platformStats.useQuery();
  const { data: clinicsList, refetch: refetchClinics } = trpc.superAdmin.listClinics.useQuery({
    search: search || undefined,
    planFilter: planFilter as any,
    statusFilter: statusFilter as any,
  });
  const { data: clinicDetail } = trpc.superAdmin.clinicDetail.useQuery(
    { clinicId: selectedClinic! },
    { enabled: !!selectedClinic }
  );

  const toggleStatus = trpc.superAdmin.toggleClinicStatus.useMutation({
    onSuccess: () => {
      toast.success("Status da clínica atualizado");
      refetchClinics();
    },
    onError: (err) => toast.error(err.message),
  });

  const updatePlan = trpc.superAdmin.updateClinicPlan.useMutation({
    onSuccess: () => {
      toast.success("Plano atualizado com sucesso");
      refetchClinics();
    },
    onError: (err) => toast.error(err.message),
  });

  if (user?.role !== "admin" && user?.role !== "platform_admin") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Shield className="w-12 h-12 mx-auto text-red-400 mb-4" />
            <h2 className="text-xl font-bold mb-2">Acesso Restrito</h2>
            <p className="text-muted-foreground">
              Esta área é exclusiva para administradores da plataforma.
            </p>
            <Button asChild className="mt-4">
              <Link to="/dashboard">Voltar ao Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Detalhe de uma clínica
  if (selectedClinic && clinicDetail) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => setSelectedClinic(null)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{clinicDetail.clinic.name}</h1>
            <p className="text-muted-foreground">CNPJ: {clinicDetail.clinic.cnpj}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Plano</CardDescription>
            </CardHeader>
            <CardContent>
              <PlanBadge plan={clinicDetail.clinic.plan} />
              <span className="ml-2"><StatusBadge status={clinicDetail.clinic.planStatus} /></span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pacientes</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{clinicDetail.stats.patients}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Profissionais</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{clinicDetail.stats.professionals}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Evoluções</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{clinicDetail.stats.evolutions}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações da Clínica</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><strong>E-mail:</strong> {clinicDetail.clinic.email}</div>
              <div><strong>Telefone:</strong> {clinicDetail.clinic.phone || "-"}</div>
              <div><strong>Endereço:</strong> {clinicDetail.clinic.address || "-"}</div>
              <div><strong>Cidade/UF:</strong> {clinicDetail.clinic.city || "-"}/{clinicDetail.clinic.state || "-"}</div>
              <div><strong>Criada em:</strong> {new Date(clinicDetail.clinic.createdAt).toLocaleDateString("pt-BR")}</div>
              <div><strong>Stripe Customer:</strong> {clinicDetail.clinic.stripeCustomerId || "Não vinculado"}</div>
              <div><strong>Limite Profissionais:</strong> {clinicDetail.clinic.maxProfessionals}</div>
              <div><strong>Limite Pacientes:</strong> {clinicDetail.clinic.maxPatients}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Membros ({clinicDetail.members.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {clinicDetail.members.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhum membro cadastrado.</p>
            ) : (
              <div className="space-y-2">
                {clinicDetail.members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{m.userName || "Sem nome"}</p>
                      <p className="text-sm text-muted-foreground">{m.userEmail || "-"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{m.role}</Badge>
                      <Badge className={m.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                        {m.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ações Administrativas</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4 flex-wrap">
            <Button
              variant={clinicDetail.clinic.active ? "destructive" : "default"}
              onClick={() => toggleStatus.mutate({
                clinicId: clinicDetail.clinic.id,
                active: !clinicDetail.clinic.active,
              })}
            >
              {clinicDetail.clinic.active ? (
                <><ToggleRight className="w-4 h-4 mr-2" /> Desativar Clínica</>
              ) : (
                <><ToggleLeft className="w-4 h-4 mr-2" /> Ativar Clínica</>
              )}
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Crown className="w-4 h-4 mr-2" /> Alterar Plano
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Alterar Plano da Clínica</DialogTitle>
                  <DialogDescription>
                    Altere manualmente o plano e status da assinatura.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <label className="text-sm font-medium">Plano</label>
                    <Select
                      defaultValue={clinicDetail.clinic.plan}
                      onValueChange={(val) => {
                        updatePlan.mutate({
                          clinicId: clinicDetail.clinic.id,
                          plan: val as any,
                          planStatus: clinicDetail.clinic.planStatus,
                        });
                      }}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="trial">Trial</SelectItem>
                        <SelectItem value="basic">Básico</SelectItem>
                        <SelectItem value="professional">Profissional</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <Select
                      defaultValue={clinicDetail.clinic.planStatus}
                      onValueChange={(val) => {
                        updatePlan.mutate({
                          clinicId: clinicDetail.clinic.id,
                          plan: clinicDetail.clinic.plan,
                          planStatus: val as any,
                        });
                      }}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="trialing">Trial</SelectItem>
                        <SelectItem value="past_due">Pagamento Pendente</SelectItem>
                        <SelectItem value="canceled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Dashboard principal
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Crown className="w-8 h-8 text-yellow-500" />
          Painel Super Admin
        </h1>
        <p className="text-muted-foreground mt-1">Gestão global da plataforma PEET</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Building2 className="w-4 h-4" /> Clínicas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.totalClinics || 0}</p>
            <p className="text-xs text-muted-foreground">{stats?.activeClinics || 0} ativas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Users className="w-4 h-4" /> Usuários
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.totalUsers || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <UserCheck className="w-4 h-4" /> Pacientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.totalPatients || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <DollarSign className="w-4 h-4" /> MRR
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{formatCurrency(stats?.mrr || 0)}</p>
            <p className="text-xs text-muted-foreground">{stats?.paidClinics || 0} assinaturas pagas</p>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" /> Distribuição por Plano
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.planDistribution?.map((item) => (
                <div key={item.plan} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PlanBadge plan={item.plan} />
                  </div>
                  <span className="font-semibold">{item.count}</span>
                </div>
              ))}
              {(!stats?.planDistribution || stats.planDistribution.length === 0) && (
                <p className="text-muted-foreground text-sm">Nenhuma clínica cadastrada ainda.</p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5" /> Distribuição por Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.statusDistribution?.map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={item.status} />
                  </div>
                  <span className="font-semibold">{item.count}</span>
                </div>
              ))}
              {(!stats?.statusDistribution || stats.statusDistribution.length === 0) && (
                <p className="text-muted-foreground text-sm">Nenhuma clínica cadastrada ainda.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métricas de uso */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <FileText className="w-4 h-4" /> Evoluções Registradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.totalEvolutions || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Clínicas em Trial</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{stats?.trialClinics || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Taxa de Conversão</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-indigo-600">
              {stats?.totalClinics
                ? Math.round(((stats.paidClinics || 0) / stats.totalClinics) * 100)
                : 0}%
            </p>
            <p className="text-xs text-muted-foreground">Trial → Pago</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Clínicas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Clínicas Cadastradas
          </CardTitle>
          <CardDescription>Gerencie todas as clínicas da plataforma</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CNPJ ou e-mail..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Planos</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="basic">Básico</SelectItem>
                <SelectItem value="professional">Profissional</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="trialing">Trial</SelectItem>
                <SelectItem value="past_due">Pendente</SelectItem>
                <SelectItem value="canceled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!clinicsList || clinicsList.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>Nenhuma clínica encontrada.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {clinicsList.map((clinic) => (
                <div
                  key={clinic.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition"
                  onClick={() => setSelectedClinic(clinic.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">{clinic.name}</p>
                      <PlanBadge plan={clinic.plan} />
                      <StatusBadge status={clinic.planStatus} />
                      {!clinic.active && <Badge variant="destructive">Desativada</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      CNPJ: {clinic.cnpj} | {clinic.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="text-center">
                      <p className="font-semibold text-foreground">{clinic.patientsCount}</p>
                      <p>Pacientes</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-foreground">{clinic.professionalsCount}</p>
                      <p>Profissionais</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-foreground">{clinic.evolutionsCount}</p>
                      <p>Evoluções</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
