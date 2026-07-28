import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Loader2, MailCheck, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { passwordResetRedirectUrl } from "@/lib/authRecovery";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { RecoverySteps } from "@/components/auth/RecoverySteps";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/form/Field";

const schema = z.object({
  email: z.string().min(1, "Informe o e-mail").email("E-mail inválido"),
});
type FormValues = z.infer<typeof schema>;

// Intervalo antes de liberar um novo envio — o Supabase também limita o envio
// por e-mail, então pedir de novo em seguida costuma só gerar erro.
const RESEND_SECONDS = 60;

export default function ForgotPassword() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [cooldown]);

  const sendLink = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: passwordResetRedirectUrl(),
    });

    if (error) {
      // Excesso de tentativas é o único erro que o usuário consegue resolver
      // sozinho — os demais são falha de infraestrutura.
      const tooMany = error.status === 429;
      toast.error(
        tooMany ? "Muitas tentativas seguidas" : "Não foi possível enviar o link",
        {
          description: tooMany
            ? "Aguarde alguns minutos antes de pedir outro link."
            : error.message,
        },
      );
      return false;
    }
    setCooldown(RESEND_SECONDS);
    return true;
  }, []);

  async function onSubmit(values: FormValues) {
    const email = values.email.trim().toLowerCase();
    // Confirmação neutra: não revelamos se o e-mail tem conta no TEAR.
    if (await sendLink(email)) setSentTo(email);
  }

  async function onResend() {
    if (!sentTo || cooldown > 0) return;
    if (await sendLink(sentTo)) {
      toast.success("Link reenviado", { description: sentTo });
    }
  }

  if (sentTo) {
    return (
      <AuthLayout
        above={<RecoverySteps current={1} />}
        title="Confira seu e-mail"
        subtitle={
          <>
            Se existir uma conta para <strong className="font-semibold text-foreground">{sentTo}</strong>,
            enviamos um link para criar uma nova senha. Ele vale por uma única
            redefinição.
          </>
        }
      >
        <div className="mt-8 flex items-start gap-3 rounded-xl border border-border bg-secondary/40 p-4">
          <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Não chegou?</p>
            <p className="mt-1">
              Verifique a caixa de spam e confirme se o endereço está correto.
              Abra o link no mesmo navegador em que você o solicitou.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            onClick={onResend}
            disabled={cooldown > 0 || isSubmitting}
          >
            {cooldown > 0 ? `Reenviar em ${cooldown}s` : "Reenviar link"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="lg"
            className="w-full"
            onClick={() => setSentTo(null)}
          >
            Usar outro e-mail
          </Button>
        </div>

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
      above={<RecoverySteps current={0} />}
      title="Recuperar acesso"
      subtitle="Informe o e-mail da sua conta. Enviaremos um link seguro para você criar uma nova senha."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
        <Field label="E-mail" error={errors.email?.message} required>
          <Input
            type="email"
            autoComplete="email"
            autoFocus
            placeholder="voce@clinica.com.br"
            {...register("email")}
          />
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
              Enviar link seguro
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 font-semibold text-accent hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Voltar para o login
        </Link>
      </p>

      <p className="mt-4 flex items-start justify-center gap-1.5 text-center text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>
          Por segurança, não informamos se um e-mail está cadastrado. O link
          expira e só pode ser usado uma vez.
        </span>
      </p>
    </AuthLayout>
  );
}
