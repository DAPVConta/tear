import type { LucideIcon } from "lucide-react";
import { CardTitle } from "@/components/ui/card";

// Título de seção com ícone temático tintado pela paleta da marca,
// usado nos cabeçalhos dos Cards dos formulários.
export function SectionTitle({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <CardTitle className="flex items-center gap-2.5">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent/12 text-accent">
        <Icon className="h-4 w-4" />
      </span>
      <span>{children}</span>
    </CardTitle>
  );
}
