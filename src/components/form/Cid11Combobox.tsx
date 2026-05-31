import { useMemo } from "react";
import { Combobox } from "@/components/ui/combobox";
import { CID11_DATASET } from "@/lib/cid11";

// Combobox especializado em CID-11 — busca por código ou descrição. Permite
// valor livre (código fora do recorte curado): se o valor atual não está na
// base, é exibido como opção "personalizada". Mostra o CID-10 equivalente na
// descrição da opção para reforçar a correspondência de faturamento.
export function Cid11Combobox({
  value,
  onChange,
  placeholder = "Buscar CID-11...",
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const options = useMemo(() => {
    const base = CID11_DATASET.map((c) => ({
      value: c.code,
      label: c.code,
      description: c.cid10
        ? `${c.description} · CID-10: ${c.cid10}`
        : c.description,
    }));
    if (value && !CID11_DATASET.find((c) => c.code === value)) {
      base.unshift({
        value,
        label: value,
        description: "Código personalizado",
      });
    }
    return base;
  }, [value]);

  return (
    <Combobox
      value={value}
      onValueChange={onChange}
      options={options}
      placeholder={placeholder}
      searchPlaceholder="Buscar por código ou descrição..."
      emptyMessage="Nenhum CID-11 encontrado."
      disabled={disabled}
    />
  );
}
