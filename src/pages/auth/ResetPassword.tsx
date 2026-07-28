import { useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2, LockKeyhole, ShieldAlert } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import {
  clearAuthRedirectParams,
  getAuthRedirectError,
  isPasswordRecoveryRedirect,
} from "@/lib/authRecovery";
import { passwordSchema } from "@/lib/password";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { RecoverySteps } from "@/components/auth/RecoverySteps";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/form/Field";

const schema = z
  .object({
    password: passwordSchema,
    confirmation: z.string().min(1, "Repita a nova senha"),
  })
  .refine((v) => v.password === v.confirmation, {
    path: ["confirmation"],
    message: "As senhas não coincidem",
  });
type FormValues = z.infer<typeof schema>;

export default function ResetPassword() {
  const navigate = useNavigate();
  // A sessão vem do próprio link do e-mail: o supabase-js consome o token do
  // fragmento da URL (detectSessionInUrl) e autentica o usuário só para esta
  // troca de senha.
  const { user, loading, signOut } = useAuth();
  const linkError = useMemo(getAuthRedirectError, []);
  const fromEmailLink = useMemo(isPasswordRecoveryRedirect, []);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const password = watch("password") ?? "";

  // Só depois que o Auth terminou de ler a URL é seguro limpá-la — antes disso
  // o token ainda não foi consumido.
  useEffect(() => {
    if (!loading) clearAuthRedirectParams();
  }, [loading]);

  async function onSubmit(values: FormValues) {
    const { error } = await supabase.auth.updateUser({
      password: values.password,
    });

    if (error) {
      if (error.code === "same_password") {
        setError("password", {
          message: "A nova senha precisa ser diferente da anterior",
        });
        return;
      }
      toast.error("Não foi possível salvar a nova senha", {
        description:
          error.code === "weak_password"
            ? "Escolha uma senha mais forte."
            : error.message,
      });
      return;
    }

    // Encerramos a sessão criada pelo link e pedimos o login com a senha nova:
    // fecha a janela aberta pelo e-mail e confirma, na prática, que a troca
    // funcionou (ver política de sessão em lib/authStorage).
    await signOut();
    toast.success("Senha alterada", {
      description: "Entre com a nova senha para continuar.",
    });
    navigate("/login", { replace: true });
  }

  if (loading) {
    return (
      <AuthLayout
        above={<RecoverySteps current={2} />}
        title="Validando seu link"
        subtitle="Um instante enquanto confirmamos o link enviado por e-mail."
      >
        <div className="mt-8 flex items-center gap-3 rounded-xl border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Verificando…
        </div>
      </AuthLayout>
    );
  }

  if (linkError || !user) {
    return (
      <AuthLayout
        above={<RecoverySteps current={1} />}
        title={
          linkError || fromEmailLink ? "Link não validado" : "Abra o link do e-mail"
        }
        subtitle={
          linkError?.description ??
          (fromEmailLink
            ? "Não conseguimos confirmar este link de redefinição. Peça um novo para continuar."
            : "Abra o link enviado para o seu e-mail para criar uma nova senha.")
        }
      >
        <div className="mt-8 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <ShieldAlert
            className="mt-0.5 h-5 w-5 shrink-0 text-destructive-text"
            aria-hidden="true"
          />
          <p className="text-sm text-muted-foreground">
            Cada link de redefinição vale por um único uso e expira depois de
            algum tempo. Pedir um novo leva menos de um minuto.
          </p>
        </div>

        <Button
          asChild
          variant="brand"
          size="lg"
          className="mt-6 w-full"
        >
          <Link to="/esqueci-senha">Pedir novo link</Link>
        </Button>

        <p className="mt-6 text-center text-sm">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 font-semibold text-accent hover:underline"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Voltar para o login
          </Link>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      above={<RecoverySteps current={2} />}
      title="Criar nova senha"
      subtitle={
        <>
          Você está redefinindo a senha de{" "}
          <strong className="font-semibold text-foreground">{user.email}</strong>.
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
        <div>
          <Field
            label="Nova senha"
            error={errors.password?.message}
            hint="Mínimo de 8 caracteres, com letras e números."
            required
          >
            <PasswordInput
              autoComplete="new-password"
              autoFocus
              {...register("password")}
            />
          </Field>
          <PasswordStrength value={password} />
        </div>

        <Field
          label="Repita a nova senha"
          error={errors.confirmation?.message}
          required
        >
          <PasswordInput autoComplete="new-password" {...register("confirmation")} />
        </Field>

        <Button
          type="submit"
          variant="brand"
          size="lg"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <LockKeyhole className="h-4 w-4" />
              Salvar nova senha
            </>
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Ao salvar, pediremos o login novamente com a nova senha.
      </p>
    </AuthLayout>
  );
}
