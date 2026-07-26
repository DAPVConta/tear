import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Loader2,
  UserPlus,
  ShieldCheck,
  KeyRound,
  Copy,
  Check,
  UserCheck,
  UserX,
  Mail,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Field } from "@/components/form/Field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ListEmptyState, ListErrorBanner } from "@/components/ui/list-states";
import { memberRoleLabels } from "@/lib/labels";
import {
  useClinicAdmins,
  useCreateClinicAdmin,
  useResetClinicAdminPassword,
  useSetClinicMemberActive,
  type PlatformClinicMember,
} from "@/features/clinics/api";

const schema = z.object({
  name: z.string().min(2, "Informe o nome do administrador"),
  email: z.string().email("E-mail inválido"),
  role: z.enum(["clinic_owner", "clinic_admin"]),
  password: z
    .string()
    .optional()
    .refine((v) => !v || v.length >= 8, "A senha deve ter ao menos 8 caracteres"),
});
type FormValues = z.infer<typeof schema>;

export function ClinicAdminsPanel({
  clinicId,
  clinicName,
}: {
  clinicId: number;
  clinicName: string;
}) {
  const { data, isLoading, isError } = useClinicAdmins(clinicId);
  const createAdmin = useCreateClinicAdmin();
  const resetPassword = useResetClinicAdminPassword();
  const setActive = useSetClinicMemberActive();

  const [dialogOpen, setDialogOpen] = useState(false);
  // Credencial exibida UMA vez após criar/redefinir — nunca fica salva.
  const [credential, setCredential] = useState<{
    email: string;
    password: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: "clinic_owner" },
  });

  async function onSubmit(values: FormValues) {
    try {
      const result = await createAdmin.mutateAsync({
        clinicId,
        name: values.name,
        email: values.email,
        password: values.password || undefined,
        role: values.role,
      });
      setDialogOpen(false);
      reset({ role: "clinic_owner", name: "", email: "", password: "" });
      if (result.created && result.password) {
        setCredential({ email: result.email, password: result.password });
        toast.success("Administrador criado", {
          description: "Copie a senha temporária e repasse ao responsável.",
        });
      } else {
        toast.success("Usuário existente vinculado à clínica", {
          description: "Ele acessa com a senha que já usa na plataforma.",
        });
      }
    } catch (e) {
      toast.error("Não foi possível criar o administrador", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

  async function onResetPassword(m: PlatformClinicMember) {
    try {
      const result = await resetPassword.mutateAsync({
        clinicId,
        userId: m.user_id,
      });
      setCredential({ email: m.email ?? "", password: result.password });
      toast.success("Nova senha gerada");
    } catch (e) {
      toast.error("Não foi possível redefinir a senha", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

  async function onToggleActive(m: PlatformClinicMember) {
    try {
      await setActive.mutateAsync({
        clinicId,
        memberId: m.member_id,
        active: !m.active,
      });
      toast.success(m.active ? "Acesso revogado" : "Acesso restabelecido");
    } catch (e) {
      toast.error("Não foi possível alterar o acesso", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

  const members = data ?? [];
  const hasOwner = members.some((m) => m.role === "clinic_owner" && m.active);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-bold tracking-tight">
            Equipe de acesso
          </h2>
          <p className="text-sm text-muted-foreground">
            Crie o administrador titular de {clinicName}. Ele recebe login
            próprio e passa a gerenciar a clínica.
          </p>
        </div>
        <Button variant="brand" onClick={() => setDialogOpen(true)}>
          <UserPlus className="h-4 w-4" /> Criar administrador
        </Button>
      </div>

      {!isLoading && !hasOwner && (
        <div className="flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/5 p-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-warning-text" />
          <p className="text-sm text-warning-text">
            Esta clínica ainda não tem administrador titular. Sem ele, ninguém
            consegue configurar a operação nem convidar a equipe.
          </p>
        </div>
      )}

      {credential && (
        <CredentialCard
          email={credential.email}
          password={credential.password}
          onDismiss={() => setCredential(null)}
        />
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pessoa</TableHead>
              <TableHead>Papel</TableHead>
              <TableHead>Acesso</TableHead>
              <TableHead>Entrou em</TableHead>
              <TableHead className="w-56" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-3/4" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            {!isLoading &&
              members.map((m) => (
                <TableRow key={m.member_id} className={m.active ? "" : "opacity-60"}>
                  <TableCell>
                    <p className="font-semibold">{m.name ?? "—"}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" /> {m.email ?? "—"}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={m.role === "clinic_owner" ? "default" : "outline"}
                    >
                      {memberRoleLabels[m.role]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={m.active ? "success" : "muted"}>
                      {m.active ? "Liberado" : "Revogado"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {m.joined_at
                      ? format(parseISO(m.joined_at), "dd/MM/yyyy")
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onResetPassword(m)}
                        disabled={resetPassword.isPending}
                      >
                        <KeyRound className="h-4 w-4" /> Nova senha
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggleActive(m)}
                        disabled={setActive.isPending}
                      >
                        {m.active ? (
                          <>
                            <UserX className="h-4 w-4" /> Revogar
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-4 w-4" /> Liberar
                          </>
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>

        {!isLoading && isError && (
          <ListErrorBanner message="Não foi possível carregar a equipe desta clínica." />
        )}
        {!isLoading && !isError && members.length === 0 && (
          <ListEmptyState
            icon={UserPlus}
            title="Nenhum acesso criado"
            description="Crie o administrador titular para que a clínica comece a operar."
            action={
              <Button variant="brand" onClick={() => setDialogOpen(true)}>
                <UserPlus className="h-4 w-4" /> Criar administrador
              </Button>
            }
          />
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar administrador</DialogTitle>
            <DialogDescription>
              O acesso é criado no Supabase Auth e vinculado a {clinicName}. Se
              o e-mail já existir na plataforma, o usuário é apenas vinculado.
            </DialogDescription>
          </DialogHeader>

          <form
            id="clinic-admin-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <Field label="Nome" required error={errors.name?.message}>
              <Input placeholder="Nome completo" {...register("name")} />
            </Field>
            <Field label="E-mail de acesso" required error={errors.email?.message}>
              <Input
                type="email"
                placeholder="responsavel@clinica.com.br"
                {...register("email")}
              />
            </Field>
            <Field label="Papel" required>
              <Select
                value={watch("role")}
                onValueChange={(v) =>
                  setValue("role", v as FormValues["role"], {
                    shouldDirty: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clinic_owner">
                    {memberRoleLabels.clinic_owner}
                  </SelectItem>
                  <SelectItem value="clinic_admin">
                    {memberRoleLabels.clinic_admin}
                  </SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field
              label="Senha temporária"
              hint="Deixe em branco para gerar automaticamente."
              error={errors.password?.message}
            >
              <Input
                type="text"
                autoComplete="new-password"
                placeholder="Gerada automaticamente"
                {...register("password")}
              />
            </Field>
          </form>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="clinic-admin-form"
              variant="brand"
              disabled={createAdmin.isPending}
            >
              {createAdmin.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <UserPlus className="h-4 w-4" /> Criar acesso
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// A senha aparece uma única vez: some ao sair da tela e não volta.
function CredentialCard({
  email,
  password,
  onDismiss,
}: {
  email: string;
  password: string;
  onDismiss: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${email} / ${password}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar");
    }
  }

  return (
    <div className="rounded-2xl border border-accent/40 bg-accent/5 p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 font-semibold">
            <KeyRound className="h-4 w-4 text-accent" /> Credencial de primeiro
            acesso
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Anote agora — por segurança, ela não é exibida de novo.
          </p>
          <dl className="mt-3 grid gap-1 text-sm">
            <div className="flex gap-2">
              <dt className="text-muted-foreground">E-mail</dt>
              <dd className="font-mono">{email}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Senha</dt>
              <dd className="font-mono tracking-wider">{password}</dd>
            </div>
          </dl>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={copy}>
            {copied ? (
              <>
                <Check className="h-4 w-4" /> Copiado
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" /> Copiar
              </>
            )}
          </Button>
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            Ocultar
          </Button>
        </div>
      </div>
    </div>
  );
}
