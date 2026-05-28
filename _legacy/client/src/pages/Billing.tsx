import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, CreditCard, Sparkles } from "lucide-react";

export default function Billing() {
  const { data: plans } = trpc.stripe.getPlans.useQuery();
  const { data: subscription } = trpc.stripe.getSubscriptionStatus.useQuery();
  const { data: currentClinic } = trpc.clinics.current.useQuery();
  
  const createCheckout = trpc.stripe.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        toast.info("Redirecionando para o checkout...");
        window.open(data.url, "_blank");
      }
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const createPortal = trpc.stripe.createPortalSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, "_blank");
      }
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const currentPlan = subscription?.plan || "trial";

  const getPlanBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-green-100 text-green-800">Ativo</Badge>;
      case "trialing": return <Badge className="bg-blue-100 text-blue-800">Trial</Badge>;
      case "past_due": return <Badge className="bg-yellow-100 text-yellow-800">Pagamento Pendente</Badge>;
      case "canceled": return <Badge className="bg-red-100 text-red-800">Cancelado</Badge>;
      default: return <Badge variant="outline">-</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Assinatura e Pagamentos</h1>
        <p className="text-muted-foreground mt-1">Gerencie o plano da sua clínica</p>
      </div>

      {/* Status atual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Plano Atual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold capitalize">{currentPlan}</p>
              <p className="text-sm text-muted-foreground">
                Status: {getPlanBadge(subscription?.status || "trialing")}
              </p>
              {subscription?.currentPeriodEnd && (
                <p className="text-sm text-muted-foreground mt-1">
                  Próxima cobrança: {new Date(subscription.currentPeriodEnd).toLocaleDateString("pt-BR")}
                </p>
              )}
            </div>
            {subscription?.plan !== "trial" && (
              <Button variant="outline" onClick={() => createPortal.mutate()}>
                Gerenciar Assinatura
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Planos disponíveis */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-500" />
          Planos Disponíveis
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {plans?.filter(p => p.id !== "trial").map((plan) => (
            <Card key={plan.id} className={`relative ${plan.id === "professional" ? "border-blue-500 border-2" : ""}`}>
              {plan.id === "professional" && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-blue-600 text-white">Mais Popular</Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="pt-2">
                  <span className="text-3xl font-bold">
                    R$ {(plan.price / 100).toFixed(2).replace(".", ",")}
                  </span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.id === currentPlan ? "outline" : "default"}
                  disabled={plan.id === currentPlan || createCheckout.isPending}
                  onClick={() => {
                    if (!currentClinic?.id) {
                      toast.error("Você precisa estar vinculado a uma clínica para assinar.");
                      return;
                    }
                    createCheckout.mutate({
                      planId: plan.id as "basic" | "professional" | "enterprise",
                      clinicId: currentClinic.id,
                    });
                  }}
                >
                  {plan.id === currentPlan ? "Plano Atual" : "Assinar"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
