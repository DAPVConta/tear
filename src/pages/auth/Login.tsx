import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, ArrowRight, ShieldCheck, FileCheck2, Sparkles } from "lucide-react";
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
      {/* Painel da marca — aurora multicor da paleta + motivo das barras */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-brand-radial p-12 text-white lg:flex">
        {/* Blobs aurora desfocados (diversidade da marca) */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-brand-blue-light/30 blur-3xl" />
          <div className="absolute right-[-10%] top-1/3 h-80 w-80 rounded-full bg-brand-cyan/20 blur-3xl" />
          <div className="absolute bottom-[-12%] left-1/4 h-72 w-72 rounded-full bg-brand-yellow/15 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 h-56 w-56 rounded-full bg-brand-red/10 blur-3xl" />
        </div>
        <div className="absolute inset-0 bg-grid opacity-[0.07] [mask-image:radial-gradient(120%_120%_at_30%_20%,black,transparent_75%)]" />

        <Link to="/" className="relative w-fit">
          <Logo />
        </Link>

        <div className="relative">
          {/* Barras coloridas — motivo da marca (diversidade/desenvolvimento) */}
          <div className="mb-7 flex gap-2" aria-hidden="true">
            <span className="h-1.5 w-14 rounded-full bg-brand-blue-light" />
            <span className="h-1.5 w-9 rounded-full bg-brand-yellow" />
            <span className="h-1.5 w-6 rounded-full bg-brand-red" />
          </div>
          <h2 className="max-w-md text-balance text-[2.5rem] font-extrabold leading-[1.08] tracking-tight">
            Tecnologia que conecta cuidado, informação e desenvolvimento humano.
          </h2>
          <p className="mt-5 max-w-md text-lg text-white/70">
            Prontuário inteligente para clínicas de TEA.
          </p>

          {/* Credenciais / prova de seriedade */}
          <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/80">
            <li className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-brand-cyan" /> LGPD &amp; RLS por clínica
            </li>
            <li className="flex items-center gap-2">
              <FileCheck2 className="h-4 w-4 text-brand-cyan" /> Assinatura ICP-Brasil A1
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand-cyan" /> Evolução mensal com IA
            </li>
          </ul>
        </div>

        <p className="relative text-sm text-white/50">
          © {new Date().getFullYear()} TEAR · Tecnologia, Empatia, Acompanhamento e Registro
        </p>
      </div>

      {/* Formulário */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h1 className="text-h1 text-[1.75rem]">
            {mode === "login" ? "Bem-vindo de volta" : "Criar conta"}
          </h1>
          <p className="mt-2 text-body text-muted-foreground">
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
