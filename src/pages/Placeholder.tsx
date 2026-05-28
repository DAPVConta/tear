import { Hammer } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";

export function Placeholder({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-20 text-center shadow-soft">
        <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand-gradient text-white shadow-glow">
          <Hammer className="h-7 w-7" />
        </div>
        <h2 className="text-lg font-bold">Módulo em construção</h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Esta seção será entregue em um próximo incremento, com o mesmo padrão
          de qualidade do restante do sistema.
        </p>
      </div>
    </div>
  );
}
