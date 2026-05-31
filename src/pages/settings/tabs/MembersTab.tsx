import { useState } from "react";
import { toast } from "sonner";
import {
  Users,
  UserCheck,
  UserX,
  Loader2,
  Copy,
  Link2,
  Ban,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Field } from "@/components/form/Field";
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
  useClinicInvites,
  useCreateInvite,
  useRevokeInvite,
  type ClinicMember,
  type MemberRole,
} from "@/features/members/api";

const ROLES = Object.keys(memberRoleLabels) as MemberRole[];
const EXPIRY_OPTIONS: { value: string; label: string }[] = [
  { value: "7", label: "7 dias" },
  { value: "14", label: "14 dias" },
  { value: "30", label: "30 dias" },
  { value: "0", label: "Sem expiração" },
];

function inviteLink(code: string) {
  return `${window.location.origin}/onboarding?invite=${code}`;
}

export function MembersTab() {
  const { user } = useAuth();
  const { role } = useClinic();
  const list = useClinicMembers();
  const updateRole = useUpdateMemberRole();
  const setActive = useSetMemberActive();
  const invites = useClinicInvites();
  const createInvite = useCreateInvite();
  const revokeInvite = useRevokeInvite();
  const [inviteRole, setInviteRole] = useState<MemberRole>("therapist");
  const [inviteExpiry, setInviteExpiry] = useState("14");

  const canManage = role === "clinic_admin";

  async function copyText(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copiado`);
    } catch {
      toast.error("Não foi possível copiar");
    }
  }

  async function onCreateInvite() {
    try {
      const inv = await createInvite.mutateAsync({
        role: inviteRole,
        expiresDays: inviteExpiry === "0" ? null : Number(inviteExpiry),
      });
      await copyText(inviteLink(inv.code), "Link do convite");
    } catch (e) {
      toast.error("Não foi possível gerar o convite", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

  async function onRevoke(id: number) {
    try {
      await revokeInvite.mutateAsync(id);
      toast.success("Convite revogado");
    } catch (e) {
      toast.error("Não foi possível revogar", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

  const activeInvites = (invites.data ?? []).filter((i) => i.active);
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
      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-muted-foreground" /> Convidar membro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Gere um link/código de convite. A pessoa cria a conta no TEAR e usa
              o código para entrar na clínica com o papel escolhido.
            </p>
            <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <Field label="Papel">
                <Select
                  value={inviteRole}
                  onValueChange={(v) => setInviteRole(v as MemberRole)}
                >
                  <SelectTrigger>
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
              </Field>
              <Field label="Validade">
                <Select value={inviteExpiry} onValueChange={setInviteExpiry}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPIRY_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Button
                variant="brand"
                onClick={onCreateInvite}
                disabled={createInvite.isPending}
              >
                {createInvite.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="h-4 w-4" /> Gerar convite
                  </>
                )}
              </Button>
            </div>

            {activeInvites.length > 0 && (
              <ul className="space-y-2">
                {activeInvites.map((inv) => (
                  <li
                    key={inv.id}
                    className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-background p-3 text-sm"
                  >
                    <code className="rounded bg-secondary px-2 py-1 font-mono font-semibold tracking-wider">
                      {inv.code}
                    </code>
                    <Badge variant="accent">{memberRoleLabels[inv.role]}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {inv.expires_at
                        ? `expira em ${new Date(inv.expires_at).toLocaleDateString("pt-BR")}`
                        : "sem expiração"}
                    </span>
                    <div className="ml-auto flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyText(inv.code, "Código")}
                      >
                        <Copy className="h-4 w-4" /> Código
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyText(inviteLink(inv.code), "Link")}
                      >
                        <Link2 className="h-4 w-4" /> Link
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => onRevoke(inv.id)}
                        disabled={revokeInvite.isPending}
                      >
                        <Ban className="h-4 w-4" /> Revogar
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

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
