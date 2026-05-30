import { Input } from "@/components/ui/input";
import { maskCPF, maskCNPJ, maskPhone } from "@/lib/masks";
import { forwardRef } from "react";

type MaskType = "cpf" | "cnpj" | "phone";

interface MaskedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  mask: MaskType;
  value: string;
  onChange: (maskedValue: string) => void;
}

const maskFunctions: Record<MaskType, (value: string) => string> = {
  cpf: maskCPF,
  cnpj: maskCNPJ,
  phone: maskPhone,
};

const placeholders: Record<MaskType, string> = {
  cpf: "000.000.000-00",
  cnpj: "00.000.000/0000-00",
  phone: "(00) 00000-0000",
};

export const MaskedInput = forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ mask, value, onChange, placeholder, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const masked = maskFunctions[mask](e.target.value);
      onChange(masked);
    };

    return (
      <Input
        ref={ref}
        value={value}
        onChange={handleChange}
        placeholder={placeholder || placeholders[mask]}
        {...props}
      />
    );
  }
);

MaskedInput.displayName = "MaskedInput";
