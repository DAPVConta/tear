import { useMemo } from "react";
import { Combobox } from "@/components/ui/combobox";
import { CID10_DATASET } from "@/lib/cid10";

// Combobox especializado em CID-10 — busca por código ou descrição.
// Permite valor livre (caso o código não esteja no recorte curado): se o
// valor atual não está na base, é exibido como opção "personalizada".
export function CidCombobox({
  value,
  onChange,
  placeholder = "Buscar CID-10...",
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const options = useMemo(() => {
    const base = CID10_DATASET.map((c) => ({
      value: c.code,
      label: c.code,
      description: c.description,
    }));
    if (value && !CID10_DATASET.find((c) => c.code === value)) {
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
      emptyMessage="Nenhum CID encontrado."
      disabled={disabled}
    />
  );
}
