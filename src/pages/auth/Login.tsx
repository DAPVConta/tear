import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, ArrowRight, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { isRememberMeEnabled, setRememberMe } from "@/lib/authStorage";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const schema = z.object({
  name: z.string().optional(),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Mínimo de 6 caracteres"),
});
type FormValues = z.infer<typeof schema>;

export default function Login() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  // Preferência do dispositivo: onde o token será guardado (ver lib/authStorage).
  const [remember, setRemember] = useState(isRememberMeEnabled);
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    // Decide o destino do token ANTES de autenticar, para que a sessão nova
    // já nasça no storage certo.
    setRememberMe(remember);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      if (error) return toast.error("Falha no login", { description: error.message });
      navigate("/dashboard");
    } else {
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: { data: { name: values.name ?? "" } },
      });
      if (error) return toast.error("Falha no cadastro", { description: error.message });
      toast.success("Conta criada!", {
        description: "Verifique seu e-mail se a confirmação estiver ativa.",
      });
      navigate("/onboarding");
    }
  }

  return (
    <AuthLayout
      title={mode === "login" ? "Bem-vindo de volta" : "Criar conta"}
      subtitle={
        mode === "login"
          ? "Acesse o painel da sua clínica."
          : "Comece a usar o TEAR em poucos minutos."
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
        {mode === "signup" && (
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" placeholder="Seu nome" {...register("name")} />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="voce@clinica.com.br"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <Label htmlFor="password">Senha</Label>
            {mode === "login" && (
              <Link
                to="/esqueci-senha"
                className="text-xs font-semibold text-accent hover:underline"
              >
                Esqueci minha senha
              </Link>
            )}
          </div>
          <PasswordInput
            id="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            placeholder="••••••••"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-border bg-secondary/40 p-3 transition-colors hover:bg-secondary/70">
          <Checkbox
            checked={remember}
            onCheckedChange={(v) => setRemember(v === true)}
            className="mt-0.5"
            aria-describedby="remember-hint"
          />
          <span className="text-sm">
            <span className="font-medium">Manter conectado neste dispositivo</span>
            <span
              id="remember-hint"
              className="mt-0.5 block text-xs text-muted-foreground"
            >
              Deixe desmarcado em computador compartilhado da clínica.
            </span>
          </span>
        </label>

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
              {mode === "login" ? "Entrar" : "Criar conta"}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {mode === "login" ? "Não tem conta?" : "Já tem conta?"}{" "}
        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="font-semibold text-accent hover:underline"
        >
          {mode === "login" ? "Criar agora" : "Entrar"}
        </button>
      </p>

      {/* Expectativa explícita sobre a duração da sessão (ver
          lib/authStorage e config/session). */}
      <p className="mt-4 flex items-start justify-center gap-1.5 text-center text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          {remember
            ? "Você segue conectado neste dispositivo. Após 30 minutos sem uso, a sessão é encerrada."
            : "Sua sessão termina ao fechar o navegador e após 30 minutos sem uso."}
        </span>
      </p>
    </AuthLayout>
  );
}
