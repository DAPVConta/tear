import { toast } from "sonner";
import { Loader2, PenLine, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useProfessionalSignatureImage } from "@/features/professionals/api";
import {
  useSignMonthlyRubric,
  type MonthlyRow,
} from "@/features/monthlyEvolutions/api";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  monthly: MonthlyRow;
  onSigned?: () => void;
};

// Assinatura digital: aplica no relatório a assinatura digitalizada do
// profissional (cadastro). Mostra a rubrica antes de confirmar — é ela que vai
// para o documento.
export function MonthlyRubricDialog({
  open,
  onOpenChange,
  monthly,
  onSigned,
}: Props) {
  const sign = useSignMonthlyRubric(monthly.id);
  const path = monthly.professional?.signature_path;
  const { data: rubric, isLoading } = useProfessionalSignatureImage(
    open ? path : undefined,
  );

  async function handleSign() {
    try {
      await sign.mutateAsync();
      toast.success("Relatório assinado", {
        description: `Assinatura de ${monthly.professional?.name ?? "profissional"} aplicada ao documento.`,
      });
      onOpenChange(false);
      onSigned?.();
    } catch (e) {
      toast.error("Falha ao assinar", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!sign.isPending) onOpenChange(v);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenLine className="h-5 w-5 text-brand-blue-light" />
            Assinatura digital
          </DialogTitle>
          <DialogDescription>
            A assinatura cadastrada de{" "}
            <strong>{monthly.professional?.name ?? "profissional"}</strong> será
            aplicada ao relatório, com registro de data e hora. Para valor
            jurídico pleno (ICP-Brasil), use "Assinar com certificado".
          </DialogDescription>
        </DialogHeader>

        {!path ? (
          <div className="flex items-start gap-2 rounded-xl border border-amber-300/50 bg-amber-50/60 p-4 text-sm dark:bg-amber-950/20">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-muted-foreground">
              Este profissional ainda não tem assinatura digitalizada. Cadastre a
              imagem em <strong>Profissionais → Assinatura digitalizada</strong>{" "}
              para usar esta opção.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-secondary/30 p-5">
            <div className="grid h-24 place-items-center">
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : rubric ? (
                <img
                  src={rubric}
                  alt={`Assinatura de ${monthly.professional?.name ?? "profissional"}`}
                  className="max-h-24 max-w-full object-contain dark:brightness-0 dark:invert"
                />
              ) : (
                <span className="text-sm text-muted-foreground">
                  Não foi possível carregar a imagem da assinatura.
                </span>
              )}
            </div>
            <div className="mt-2 border-t border-border pt-2 text-center">
              <p className="text-sm font-semibold">
                {monthly.professional?.name ?? "—"}
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={sign.isPending}
          >
            Cancelar
          </Button>
          <Button
            variant="brand"
            onClick={handleSign}
            disabled={sign.isPending || !path}
          >
            {sign.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <PenLine className="h-4 w-4" /> Aplicar assinatura
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
