import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { SectionTitle } from "./SectionTitle";

// Wrapper alto-nível para uma seção de formulário: substitui o triplet
// Card + CardHeader + SectionTitle + CardContent repetido nos forms.
// Use SectionTitle direto quando precisar de algo customizado no cabeçalho.
export function FormSection({
  icon,
  title,
  children,
  contentClassName,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
  contentClassName?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <SectionTitle icon={icon}>{title}</SectionTitle>
      </CardHeader>
      <CardContent className={contentClassName ?? "grid gap-4 sm:grid-cols-2"}>
        {children}
      </CardContent>
    </Card>
  );
}
