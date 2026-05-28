import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Building2, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const schema = z.object({
  name: z.string().min(2, "Informe o nome da clínica"),
  cnpj: z.string().min(14, "CNPJ inválido").max(18),
  email: z.string().email("E-mail inválido"),
  phone: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function Onboarding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: user?.email ?? "" },
  });

  async function onSubmit(values: FormValues) {
    const { error } = await supabase.rpc("create_clinic", {
      p_name: values.name,
      p_cnpj: values.cnpj,
      p_email: values.email,
      p_phone: values.phone || undefined,
    });
    if (error) {
      return toast.error("Não foi possível criar a clínica", {
        description: error.message,
      });
    }
    toast.success("Clínica criada com sucesso!");
    await queryClient.invalidateQueries({ queryKey: ["current-clinic"] });
    navigate("/dashboard");
  }

  return (
    <div className="relative min-h-screen bg-background">
      <div className="absolute inset-0 -z-10 bg-grid opacity-[0.4]" />
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Logo />
        <ThemeToggle />
      </header>

      <main className="mx-auto flex max-w-xl flex-col px-6 py-12">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-gradient text-white shadow-glow">
          <Building2 className="h-7 w-7" />
        </span>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight">
          Crie sua clínica
        </h1>
        <p className="mt-2 text-muted-foreground">
          Esses dados identificam o tenant da sua clínica no TEAR. Você poderá
          editá-los depois em Configurações.
        </p>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-8 space-y-4 rounded-2xl border border-border bg-card p-6 shadow-soft"
        >
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome da clínica</Label>
            <Input id="name" placeholder="Clínica Exemplo" {...register("name")} />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input id="cnpj" placeholder="00.000.000/0000-00" {...register("cnpj")} />
              {errors.cnpj && (
                <p className="text-xs text-destructive">{errors.cnpj.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" placeholder="(00) 00000-0000" {...register("phone")} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail da clínica</Label>
            <Input
              id="email"
              type="email"
              placeholder="contato@clinica.com.br"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
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
                Criar clínica e continuar <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </main>
    </div>
  );
}
