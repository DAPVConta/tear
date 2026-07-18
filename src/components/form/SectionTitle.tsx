import type { LucideIcon } from "lucide-react";
import { CardTitle } from "@/components/ui/card";

// Título de seção com ícone em chip gradiente da marca,
// usado nos cabeçalhos dos Cards dos formulários.
export function SectionTitle({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <CardTitle className="flex items-center gap-3">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-blue-light-400 to-brand-blue-light-600 text-white shadow-glow">
        <Icon className="h-4 w-4" />
      </span>
      <span>{children}</span>
    </CardTitle>
  );
}
