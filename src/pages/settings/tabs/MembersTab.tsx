import { toast } from "sonner";
import { Users, UserCheck, UserX, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ListErrorBanner } from "@/components/ui/list-states";
import { memberRoleLabels } from "@/lib/labels";
import { useAuth } from "@/providers/AuthProvider";
import { useClinic } from "@/providers/ClinicProvider";
import {
  useClinicMembers,
  useUpdateMemberRole,
  useSetMemberActive,
  type ClinicMember,
  type MemberRole,
} from "@/features/members/api";

const ROLES = Object.keys(memberRoleLabels) as MemberRole[];

export function MembersTab() {
  const { user } = useAuth();
  const { role } = useClinic();
  const list = useClinicMembers();
  const updateRole = useUpdateMemberRole();
  const setActive = useSetMemberActive();

  const canManage = role === "clinic_admin";
  const members = list.data ?? [];
  const activeAdmins = members.filter(
    (m) => m.active && m.role === "clinic_admin",
  ).length;

  // Evita deixar a clínica sem nenhum administrador ativo.
  function isLastActiveAdmin(m: ClinicMember) {
    return m.active && m.role === "clinic_admin" && activeAdmins <= 1;
  }

  async function onChangeRole(m: ClinicMember, nextRole: MemberRole) {
    if (nextRole === m.role) return;
    if (isLastActiveAdmin(m) && nextRole !== "clinic_admin") {
      toast.error("A clínica precisa de ao menos um administrador ativo.");
      return;
    }
    try {
      await updateRole.mutateAsync({ memberId: m.member_id, role: nextRole });
      toast.success("Papel atualizado");
    } catch (e) {
      toast.error("Não foi possível alterar o papel", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

  async function onToggleActive(m: ClinicMember) {
    const next = !m.active;
    if (!next && isLastActiveAdmin(m)) {
      toast.error("A clínica precisa de ao menos um administrador ativo.");
      return;
    }
    try {
      await setActive.mutateAsync({ memberId: m.member_id, active: next });
      toast.success(next ? "Membro reativado" : "Membro inativado");
    } catch (e) {
      toast.error("Não foi possível atualizar", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-2 rounded-xl border border-accent/30 bg-accent/5 p-4 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
        <span>
          Convidar novos membros por link/código chega na próxima fase. Por
          aqui você já gerencia papéis e o acesso de quem já faz parte da
          clínica.
        </span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" /> Membros da
            clínica
          </CardTitle>
        </CardHeader>
        <CardContent>
          {list.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : list.isError ? (
            <ListErrorBanner message="Não foi possível carregar os membros." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Membro</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-28" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m) => {
                  const isSelf = m.user_id === user?.id;
                  return (
                    <TableRow key={m.member_id}>
                      <TableCell>
                        <div className="font-semibold">
                          {m.name || m.email || "—"}
                          {isSelf && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              (você)
                            </span>
                          )}
                        </div>
                        {m.name && m.email && (
                          <div className="text-xs text-muted-foreground">
                            {m.email}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {canManage ? (
                          <Select
                            value={m.role}
                            onValueChange={(v) =>
                              onChangeRole(m, v as MemberRole)
                            }
                            disabled={updateRole.isPending}
                          >
                            <SelectTrigger className="h-9 w-[150px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ROLES.map((r) => (
                                <SelectItem key={r} value={r}>
                                  {memberRoleLabels[r]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="accent">
                            {memberRoleLabels[m.role]}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={m.active ? "success" : "muted"}>
                          {m.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {canManage && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onToggleActive(m)}
                            disabled={setActive.isPending}
                            className={
                              m.active
                                ? "text-destructive hover:text-destructive"
                                : ""
                            }
                          >
                            {m.active ? (
                              <>
                                <UserX className="h-4 w-4" /> Inativar
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-4 w-4" /> Reativar
                              </>
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
