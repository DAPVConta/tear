import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Loader2,
  Building2,
  ArrowRight,
  Sparkles,
  MapPin,
  LogIn,
} from "lucide-react";
import { useRedeemInvite } from "@/features/members/api";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/form/Field";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { maskCNPJ, maskCEP, maskPhone, unmask } from "@/lib/masks";
import { fetchCnpj } from "@/lib/brasilapi";
import { useCepLookup } from "@/hooks/useCepLookup";

const schema = z.object({
  name: z.string().min(2, "Informe o nome da clínica"),
  cnpj: z.string().min(14, "CNPJ inválido").max(18),
  email: z.string().email("E-mail inválido"),
  phone: z.string().optional(),
  trade_name: z.string().optional(),
  zip_code: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function Onboarding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const { loading: cepLoading, lookup: lookupCepInfo } = useCepLookup();
  const [submitting, setSubmitting] = useState(false);
  const [inviteCode, setInviteCode] = useState(
    (searchParams.get("invite") ?? "").toUpperCase(),
  );
  const redeem = useRedeemInvite();

  async function onRedeem() {
    const code = inviteCode.trim();
    if (!code) {
      toast.error("Informe o código do convite");
      return;
    }
    try {
      await redeem.mutateAsync(code);
      toast.success("Você entrou na clínica!");
      await queryClient.invalidateQueries({ queryKey: ["current-clinic"] });
      navigate("/dashboard");
    } catch (e) {
      toast.error("Não foi possível entrar", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: user?.email ?? "" },
  });

  async function lookupCnpj() {
    const cnpj = unmask(getValues("cnpj") ?? "");
    if (cnpj.length !== 14) {
      toast.error("Digite os 14 dígitos do CNPJ");
      return;
    }
    setCnpjLoading(true);
    try {
      const info = await fetchCnpj(cnpj);
      if (!info) {
        toast.error("CNPJ não encontrado");
        return;
      }
      setValue("name", info.razao_social, { shouldDirty: true });
      if (info.nome_fantasia)
        setValue("trade_name", info.nome_fantasia, { shouldDirty: true });
      if (info.email) setValue("email", info.email, { shouldDirty: true });
      if (info.ddd_telefone_1)
        setValue("phone", maskPhone(info.ddd_telefone_1), { shouldDirty: true });
      if (info.cep) setValue("zip_code", maskCEP(info.cep), { shouldDirty: true });
      if (info.uf) setValue("state", info.uf, { shouldDirty: true });
      if (info.municipio) setValue("city", info.municipio, { shouldDirty: true });
      const street = [info.logradouro, info.numero, info.bairro]
        .filter(Boolean)
        .join(", ");
      if (street) setValue("address", street, { shouldDirty: true });
      toast.success("Dados da empresa preenchidos");
    } catch (e) {
      toast.error("Falha ao consultar BrasilAPI", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setCnpjLoading(false);
    }
  }

  function lookupCep() {
    lookupCepInfo(getValues("zip_code") ?? "", (info) => {
      setValue("state", info.state, { shouldDirty: true });
      setValue("city", info.city, { shouldDirty: true });
      const street = [info.street, info.neighborhood].filter(Boolean).join(", ");
      if (street) setValue("address", street, { shouldDirty: true });
    });
  }

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const { data: created, error } = await supabase.rpc("create_clinic", {
        p_name: values.name,
        p_cnpj: values.cnpj,
        p_email: values.email,
        p_phone: values.phone || undefined,
        p_trade_name: values.trade_name || undefined,
      });
      if (error) throw error;

      // Persiste o endereço (não cobertos pelo RPC).
      const hasAddress =
        values.address || values.city || values.state || values.zip_code;
      if (hasAddress && created) {
        const id = (created as { id?: number } | null)?.id;
        if (id) {
          await supabase
            .from("clinics")
            .update({
              address: values.address || null,
              city: values.city || null,
              state: values.state || null,
              zip_code: values.zip_code || null,
            })
            .eq("id", id);
        }
      }

      toast.success("Clínica criada com sucesso!");
      await queryClient.invalidateQueries({ queryKey: ["current-clinic"] });
      navigate("/dashboard");
    } catch (e) {
      toast.error("Não foi possível criar a clínica", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setSubmitting(false);
    }
  }

  const cnpjDigitsLen = unmask(watch("cnpj") ?? "").length;
  const cepDigitsLen = unmask(watch("zip_code") ?? "").length;

  return (
    <div className="relative min-h-screen bg-background">
      <div className="absolute inset-0 -z-10 bg-grid opacity-[0.4]" />
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Logo />
        <ThemeToggle />
      </header>

      <main className="mx-auto flex max-w-xl flex-col px-6 py-12">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <LogIn className="h-5 w-5 text-brand-blue-light" /> Tem um convite?
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Use o código que a clínica enviou para entrar na equipe.
          </p>
          <div className="mt-3 flex gap-2">
            <Input
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="Código do convite"
              className="font-mono tracking-wider"
              onKeyDown={(e) => {
                if (e.key === "Enter") onRedeem();
              }}
            />
            <Button
              type="button"
              variant="brand"
              onClick={onRedeem}
              disabled={redeem.isPending}
            >
              {redeem.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Entrar"
              )}
            </Button>
          </div>
        </div>

        <div className="my-8 flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> ou crie uma nova clínica{" "}
          <span className="h-px flex-1 bg-border" />
        </div>

        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-gradient text-white shadow-glow">
          <Building2 className="h-7 w-7" />
        </span>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight">
          Crie sua clínica
        </h1>
        <p className="mt-2 text-muted-foreground">
          Comece informando o CNPJ — preenchemos o resto automaticamente.
        </p>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-8 space-y-4 rounded-2xl border border-border bg-card p-6 shadow-soft"
        >
          <Field label="CNPJ" error={errors.cnpj?.message}>
            <div className="flex gap-2">
              <Input
                placeholder="00.000.000/0000-00"
                {...register("cnpj", {
                  onChange: (e) => {
                    e.target.value = maskCNPJ(e.target.value);
                  },
                })}
                inputMode="numeric"
              />
              <Button
                type="button"
                variant="outline"
                onClick={lookupCnpj}
                disabled={cnpjLoading || cnpjDigitsLen !== 14}
              >
                {cnpjLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Buscar
                  </>
                )}
              </Button>
            </div>
          </Field>

          <Field label="Razão social" error={errors.name?.message}>
            <Input placeholder="Nome da clínica" {...register("name")} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome fantasia">
              <Input {...register("trade_name")} />
            </Field>
            <Field label="Telefone">
              <Input
                placeholder="(00) 00000-0000"
                {...register("phone", {
                  onChange: (e) => {
                    e.target.value = maskPhone(e.target.value);
                  },
                })}
                inputMode="numeric"
              />
            </Field>
          </div>

          <Field label="E-mail da clínica" error={errors.email?.message}>
            <Input
              type="email"
              placeholder="contato@clinica.com.br"
              {...register("email")}
            />
          </Field>

          <Field label="CEP">
            <div className="flex gap-2">
              <Input
                placeholder="00000-000"
                {...register("zip_code", {
                  onChange: (e) => {
                    e.target.value = maskCEP(e.target.value);
                  },
                })}
                inputMode="numeric"
              />
              <Button
                type="button"
                variant="outline"
                onClick={lookupCep}
                disabled={cepLoading || cepDigitsLen !== 8}
              >
                {cepLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <MapPin className="h-4 w-4" /> Buscar
                  </>
                )}
              </Button>
            </div>
          </Field>

          <Field label="Endereço">
            <Input
              placeholder="Rua, número, bairro"
              {...register("address")}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Field label="Cidade">
                <Input {...register("city")} />
              </Field>
            </div>
            <Field label="UF">
              <Input maxLength={2} {...register("state")} />
            </Field>
          </div>

          <Button
            type="submit"
            variant="brand"
            size="lg"
            className="w-full"
            disabled={submitting}
          >
            {submitting ? (
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
