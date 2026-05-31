import { useState } from "react";
import { toast } from "sonner";
import { Loader2, ShieldCheck, FileKey } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/form/Field";
import {
  buildEvolutionSignaturePayload,
  useSignEvolutionDigital,
  type DailyEvolution,
} from "@/features/dailyEvolutions/api";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evolution: DailyEvolution;
  onSigned?: () => void;
};

export function SignatureDialog({
  open,
  onOpenChange,
  evolution,
  onSigned,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const signDigital = useSignEvolutionDigital(evolution.id);

  function reset() {
    setFile(null);
    setPassword("");
    setBusy(false);
  }

  async function handleSign() {
    if (!file) {
      toast.error("Selecione o arquivo do certificado (.pfx/.p12).");
      return;
    }
    setBusy(true);
    try {
      const payload = buildEvolutionSignaturePayload(evolution);
      // Assinatura gerada localmente; nada sai do navegador além do resultado.
      const { signWithA1Certificate } = await import("@/lib/digitalSignature");
      const signature = await signWithA1Certificate(file, password, payload);
      await signDigital.mutateAsync(signature);
      toast.success("Evolução assinada digitalmente", {
        description: `Titular: ${signature.signer_name}`,
      });
      reset();
      onOpenChange(false);
      onSigned?.();
    } catch (e) {
      toast.error("Falha ao assinar", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!busy) {
          if (!v) reset();
          onOpenChange(v);
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-brand-blue-light" />
            Assinatura digital ICP-Brasil
          </DialogTitle>
          <DialogDescription>
            Use seu certificado A1 (e-CPF/e-CNPJ) para assinar a evolução. O
            arquivo e a senha são processados apenas neste dispositivo — nenhum
            dado clínico ou a chave privada é enviado a servidores externos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Field label="Certificado (.pfx / .p12)">
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-input bg-background px-3.5 py-3 text-sm transition-colors hover:bg-secondary/50">
              <FileKey className="h-5 w-5 text-muted-foreground" />
              <span className="truncate">
                {file ? file.name : "Selecionar arquivo do certificado"}
              </span>
              <input
                type="file"
                accept=".pfx,.p12,application/x-pkcs12"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </Field>

          <Field label="Senha do certificado">
            <Input
              type="password"
              value={password}
              autoComplete="off"
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha (PIN) do certificado"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSign();
              }}
            />
          </Field>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Cancelar
          </Button>
          <Button variant="brand" onClick={handleSign} disabled={busy || !file}>
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" /> Assinar evolução
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
