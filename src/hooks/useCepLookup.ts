import { useState } from "react";
import { toast } from "sonner";
import { fetchCep, type CepInfo } from "@/lib/brasilapi";

// Consulta de CEP compartilhada (PatientForm, Onboarding, ...): valida os 8
// dígitos, controla o estado de loading e os toasts de erro/sucesso. Cada
// chamador decide como aplicar o resultado via callback `onFound`.
export function useCepLookup() {
  const [loading, setLoading] = useState(false);

  async function lookup(
    rawCep: string,
    onFound: (info: CepInfo) => void,
    successMessage = "Endereço preenchido pelo CEP",
  ) {
    const digits = rawCep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setLoading(true);
    try {
      const info = await fetchCep(digits);
      if (!info) {
        toast.error("CEP não encontrado");
        return;
      }
      onFound(info);
      toast.success(successMessage);
    } catch {
      toast.error("Falha ao consultar o CEP");
    } finally {
      setLoading(false);
    }
  }

  return { loading, lookup };
}
