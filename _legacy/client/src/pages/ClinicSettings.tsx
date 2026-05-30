import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Building2, Users, Shield, UserPlus } from "lucide-react";

export default function ClinicSettings() {
  const { data: clinic } = trpc.clinics.current.useQuery();
  const { data: members } = trpc.clinics.listMembers.useQuery();

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "clinic_admin": return <Badge className="bg-purple-100 text-purple-800">Administrador</Badge>;
      case "therapist": return <Badge className="bg-blue-100 text-blue-800">Terapeuta</Badge>;
      case "receptionist": return <Badge className="bg-green-100 text-green-800">Recepcionista</Badge>;
      default: return <Badge variant="outline">{role}</Badge>;
    }
  };

  if (!clinic) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Nenhuma clínica vinculada. Faça o onboarding primeiro.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Configurações da Clínica</h1>
        <p className="text-muted-foreground mt-1">Gerencie os dados e membros da sua clínica</p>
      </div>

      {/* Dados da Clínica */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Dados da Clínica
          </CardTitle>
          <CardDescription>Informações cadastrais</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Nome</p>
              <p className="font-medium">{clinic.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">CNPJ</p>
              <p className="font-medium">{clinic.cnpj}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">E-mail</p>
              <p className="font-medium">{clinic.email || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Telefone</p>
              <p className="font-medium">{clinic.phone || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Plano</p>
              <Badge variant="outline" className="capitalize">{clinic.plan}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge className={clinic.planStatus === "active" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                {clinic.planStatus}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Membros da Equipe */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Equipe
              </CardTitle>
              <CardDescription>Membros vinculados à clínica</CardDescription>
            </div>
            <Button size="sm" onClick={() => toast.info("Funcionalidade de convite em breve")}>
              <UserPlus className="w-4 h-4 mr-2" />
              Convidar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members?.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <Shield className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="font-medium">{member.userName || "Sem nome"}</p>
                    <p className="text-sm text-muted-foreground">{member.userEmail || "-"}</p>
                  </div>
                </div>
                {getRoleBadge(member.role)}
              </div>
            ))}
            {(!members || members.length === 0) && (
              <p className="text-center text-muted-foreground py-4">Nenhum membro encontrado</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
