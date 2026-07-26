import { Loader2, PenLine, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SIGNATURE_ACCEPT } from "@/features/professionals/api";

type Props = {
  /** Rubrica já gravada (data URL vinda do Storage privado). */
  storedImage?: string | null;
  /** Pré-visualização do arquivo recém-selecionado, ainda não enviado. */
  pendingPreview?: string | null;
  loading?: boolean;
  removing?: boolean;
  onSelect: (file: File | null) => void;
  onRemove?: () => void;
};

// A pré-visualização imita a linha de assinatura do documento impresso: a
// rubrica repousa sobre a régua e o nome fica abaixo — o profissional vê
// exatamente como sairá no relatório, não um thumbnail solto.
export function SignatureCard({
  storedImage,
  pendingPreview,
  loading,
  removing,
  onSelect,
  onRemove,
}: Props) {
  const preview = pendingPreview ?? storedImage ?? null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PenLine className="h-4 w-4 text-muted-foreground" />
          Assinatura digitalizada
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="max-w-prose text-sm text-muted-foreground">
          Imagem da assinatura manuscrita do profissional. Ela é aplicada
          automaticamente nos relatórios que ele assina — evolução diária e
          evolução mensal. Documentos ainda não assinados saem sem a rubrica.
        </p>

        <div className="rounded-xl border border-border bg-white p-5">
          {loading ? (
            <Skeleton className="h-16 w-56" />
          ) : preview ? (
            <img
              src={preview}
              alt="Assinatura do profissional"
              className="h-16 w-auto max-w-full object-contain object-left"
            />
          ) : (
            <p className="flex h-16 items-end text-sm text-slate-400">
              Nenhuma assinatura cadastrada
            </p>
          )}
          <div className="mt-1 h-px w-64 max-w-full bg-slate-400" />
          <p className="mt-1.5 text-xs text-slate-500">
            Assinatura do(a) profissional
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary/60">
            <Upload className="h-4 w-4" />
            {preview ? "Trocar imagem" : "Enviar imagem"}
            <input
              type="file"
              accept={SIGNATURE_ACCEPT}
              className="sr-only"
              onChange={(e) => onSelect(e.target.files?.[0] ?? null)}
            />
          </label>

          {storedImage && onRemove && (
            <Button
              type="button"
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={onRemove}
              disabled={removing}
            >
              {removing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Remover
            </Button>
          )}

          {pendingPreview && (
            <span className="text-xs text-muted-foreground">
              A nova assinatura é enviada ao salvar.
            </span>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          PNG com fundo transparente é o ideal (JPG também é aceito), até 2 MB.
          Escaneie ou fotografe a assinatura em fundo branco e recorte as
          bordas. A imagem fica em armazenamento privado da clínica e não
          substitui a assinatura digital ICP-Brasil.
        </p>
      </CardContent>
    </Card>
  );
}
