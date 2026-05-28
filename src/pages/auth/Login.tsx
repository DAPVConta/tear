import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  name: z.string().optional(),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Mínimo de 6 caracteres"),
});
type FormValues = z.infer<typeof schema>;

export default function Login() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
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
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Painel da marca */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-brand-radial p-12 text-white lg:flex">
        <div className="absolute inset-0 bg-grid opacity-[0.07]" />
        <Link to="/" className="relative">
          <Logo />
        </Link>
        <div className="relative">
          <h2 className="max-w-md text-balance text-3xl font-extrabold leading-tight">
            Tecnologia que conecta cuidado, informação e desenvolvimento humano.
          </h2>
          <p className="mt-4 max-w-md text-white/70">
            Prontuário inteligente para clínicas de TEA.
          </p>
        </div>
        <p className="relative text-sm text-white/50">
          © {new Date().getFullYear()} TEAR
        </p>
      </div>

      {/* Formulário */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {mode === "login" ? "Entrar" : "Criar conta"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login"
              ? "Acesse o painel da sua clínica."
              : "Comece a usar o TEAR em poucos minutos."}
          </p>

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
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                placeholder="••••••••"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

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
        </div>
      </div>
    </div>
  );
}
