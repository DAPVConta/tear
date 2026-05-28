import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { Building2, ArrowRight, ArrowLeft, CheckCircle2, Shield, BarChart3, FileText } from "lucide-react";
import { getLoginUrl } from "@/const";
import { MaskedInput } from "@/components/MaskedInput";
import { maskCNPJ, maskCPF, maskPhone } from "@/lib/masks";

export default function Onboarding() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    cnpj: "",
    cnes: "",
    email: user?.email || "",
    phone: "",
    address: "",
    city: "",
    state: "",
    responsibleName: user?.name || "",
    responsibleCpf: "",
  });

  const utils = trpc.useUtils();

  const createClinic = trpc.clinics.create.useMutation({
    onSuccess: () => {
      toast.success("Clínica cadastrada com sucesso! Bem-vindo ao PEET.");
      // Invalidar o cache para que o ProtectedPage detecte a nova clínica
      utils.clinics.current.invalidate();
      // Pequeno delay para garantir que o cache foi atualizado
      setTimeout(() => {
        navigate("/dashboard");
      }, 500);
    },
    onError: (err) => {
      toast.error("Erro ao criar clínica: " + err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.name.length < 3) {
      toast.error("Nome da clínica deve ter no mínimo 3 caracteres");
      return;
    }
    if (!formData.cnpj || formData.cnpj.length < 14) {
      toast.error("CNPJ deve ter no mínimo 14 dígitos");
      return;
    }
    createClinic.mutate({
      name: formData.name,
      cnpj: formData.cnpj.replace(/\D/g, "").padEnd(14, "0"),
      cnes: formData.cnes || undefined,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      address: formData.address || undefined,
      city: formData.city || undefined,
      state: formData.state || undefined,
      responsibleName: formData.responsibleName || undefined,
      responsibleCpf: formData.responsibleCpf || undefined,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Acesse o PEET</CardTitle>
            <CardDescription>
              Faça login para cadastrar sua clínica e começar a usar o sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => { window.location.href = getLoginUrl(); }}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              Fazer Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <img 
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663476466436/ZtPXefNGUgtV4fQsKuYU5M/peet-logo-SWD2rwYg2Y6YowydnPvBmy.webp" 
            alt="PEET" 
            className="w-16 h-16 mx-auto mb-4" 
          />
          <h1 className="text-3xl font-bold text-gray-900">Bem-vindo ao PEET!</h1>
          <p className="text-gray-600 mt-2">
            Olá, <strong>{user?.name || "usuário"}</strong>! Configure sua clínica para começar.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                s < step ? "bg-green-500 text-white" :
                s === step ? "bg-blue-600 text-white" :
                "bg-gray-200 text-gray-500"
              }`}>
                {s < step ? <CheckCircle2 className="w-5 h-5" /> : s}
              </div>
              <span className={`text-sm hidden sm:inline ${s === step ? "font-medium text-blue-700" : "text-gray-500"}`}>
                {s === 1 ? "Dados Básicos" : s === 2 ? "Endereço" : "Confirmar"}
              </span>
              {s < 3 && <div className={`w-8 h-px ${s < step ? "bg-green-400" : "bg-gray-300"}`} />}
            </div>
          ))}
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader>
            <CardTitle className="text-xl">
              {step === 1 && "Dados da Clínica"}
              {step === 2 && "Endereço e Responsável"}
              {step === 3 && "Confirme os Dados"}
            </CardTitle>
            <CardDescription>
              {step === 1 && "Preencha os dados básicos da sua clínica. Você terá 14 dias gratuitos para testar todas as funcionalidades."}
              {step === 2 && "Informe o endereço e o responsável técnico da clínica."}
              {step === 3 && "Revise os dados antes de criar sua clínica."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              {step === 1 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome da Clínica *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Clínica Desenvolver TEA"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cnpj">CNPJ *</Label>
                      <MaskedInput
                        id="cnpj"
                        mask="cnpj"
                        value={formData.cnpj}
                        onChange={(v) => setFormData({ ...formData, cnpj: v })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cnes">CNES (opcional)</Label>
                      <Input
                        id="cnes"
                        value={formData.cnes}
                        onChange={(e) => setFormData({ ...formData, cnes: e.target.value })}
                        placeholder="Código CNES"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail da Clínica</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="contato@clinica.com.br"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <MaskedInput
                        id="phone"
                        mask="phone"
                        value={formData.phone}
                        onChange={(v) => setFormData({ ...formData, phone: v })}
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    className="w-full bg-blue-600 hover:bg-blue-700 mt-4"
                    size="lg"
                    onClick={() => {
                      if (!formData.name || formData.name.length < 3) {
                        toast.error("Nome da clínica é obrigatório (mínimo 3 caracteres)");
                        return;
                      }
                      if (!formData.cnpj || formData.cnpj.replace(/\D/g, "").length < 14) {
                        toast.error("CNPJ é obrigatório (14 dígitos)");
                        return;
                      }
                      setStep(2);
                    }}
                  >
                    Próximo <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Rua, número, bairro"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">Cidade</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="Recife"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">Estado</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        placeholder="PE"
                        maxLength={2}
                      />
                    </div>
                  </div>
                  <div className="border-t pt-4 mt-4">
                    <h3 className="font-medium text-gray-900 mb-3">Responsável Técnico</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="responsibleName">Nome do Responsável</Label>
                        <Input
                          id="responsibleName"
                          value={formData.responsibleName}
                          onChange={(e) => setFormData({ ...formData, responsibleName: e.target.value })}
                          placeholder="Nome completo"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="responsibleCpf">CPF do Responsável</Label>
                        <MaskedInput
                          id="responsibleCpf"
                          mask="cpf"
                          value={formData.responsibleCpf}
                          onChange={(v) => setFormData({ ...formData, responsibleCpf: v })}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button type="button" variant="outline" className="flex-1" size="lg" onClick={() => setStep(1)}>
                      <ArrowLeft className="mr-2 w-4 h-4" /> Voltar
                    </Button>
                    <Button type="button" className="flex-1 bg-blue-600 hover:bg-blue-700" size="lg" onClick={() => setStep(3)}>
                      Próximo <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                    <h3 className="font-semibold text-blue-900">Resumo da Clínica</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Nome:</span>
                        <p className="font-medium">{formData.name}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">CNPJ:</span>
                        <p className="font-medium">{formData.cnpj}</p>
                      </div>
                      {formData.cnes && (
                        <div>
                          <span className="text-gray-500">CNES:</span>
                          <p className="font-medium">{formData.cnes}</p>
                        </div>
                      )}
                      {formData.email && (
                        <div>
                          <span className="text-gray-500">E-mail:</span>
                          <p className="font-medium">{formData.email}</p>
                        </div>
                      )}
                      {formData.phone && (
                        <div>
                          <span className="text-gray-500">Telefone:</span>
                          <p className="font-medium">{formData.phone}</p>
                        </div>
                      )}
                      {formData.city && (
                        <div>
                          <span className="text-gray-500">Cidade:</span>
                          <p className="font-medium">{formData.city}/{formData.state}</p>
                        </div>
                      )}
                      {formData.responsibleName && (
                        <div>
                          <span className="text-gray-500">Responsável:</span>
                          <p className="font-medium">{formData.responsibleName}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Benefícios do Trial */}
                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="font-semibold text-green-900 mb-3">Seu Trial Gratuito de 14 Dias Inclui:</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="flex items-start gap-2">
                        <Shield className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                        <div className="text-sm">
                          <p className="font-medium text-green-900">Blindagem Anti-Glosa</p>
                          <p className="text-green-700">7 regras de validação</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <BarChart3 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                        <div className="text-sm">
                          <p className="font-medium text-green-900">Evolução Mensal</p>
                          <p className="text-green-700">Geração automática por IA</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <FileText className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                        <div className="text-sm">
                          <p className="font-medium text-green-900">Auditoria</p>
                          <p className="text-green-700">Checklist de faturamento</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button type="button" variant="outline" className="flex-1" size="lg" onClick={() => setStep(2)}>
                      <ArrowLeft className="mr-2 w-4 h-4" /> Voltar
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1 bg-green-600 hover:bg-green-700" 
                      size="lg"
                      disabled={createClinic.isPending}
                    >
                      {createClinic.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Criando...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 w-4 h-4" />
                          Criar Clínica e Começar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
