import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, ShieldCheck, FileKey, Lock } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/form/Field";
import { monthlyStatusLabels } from "@/lib/labels";
import {
  canSignMonthly,
  formatMonthlyPeriod,
  useSignMonthlyBatch,
  type MonthlyRow,
} from "@/features/monthlyEvolutions/api";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Linhas exibidas na listagem — as elegíveis vêm marcadas por padrão.
  rows: MonthlyRow[];
};

export function MonthlyBatchSignatureDialog({ open, onOpenChange, rows }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(
    null,
  );
  const batch = useSignMonthlyBatch();
  const busy = batch.isPending;

  const eligible = useMemo(() => rows.filter(canSignMonthly), [rows]);
  const eligibleRef = useRef(eligible);
  eligibleRef.current = eligible;

  // Ao abrir, tudo que está pronto para assinar já vem marcado. Depois disso a
  // escolha é do usuário — um refetch da lista não mexe na seleção.
  useEffect(() => {
    if (open) setSelected(eligibleRef.current.map((r) => r.id));
  }, [open]);

  function reset() {
    setFile(null);
    setPassword("");
    setProgress(null);
  }

  function toggle(id: number, checked: boolean) {
    setSelected((prev) =>
      checked ? [...new Set([...prev, id])] : prev.filter((x) => x !== id),
    );
  }

  const allSelected = eligible.length > 0 && selected.length === eligible.length;

  async function handleSign() {
    if (!file) {
      toast.error("Selecione o arquivo do certificado (.pfx/.p12).");
      return;
    }
    const items = eligible.filter((r) => selected.includes(r.id));
    if (items.length === 0) {
      toast.error("Selecione ao menos uma evolução para assinar.");
      return;
    }
    setProgress({ done: 0, total: items.length });
    try {
      const { results, signerName } = await batch.mutateAsync({
        file,
        password,
        items,
        onProgress: (done, total) => setProgress({ done, total }),
      });
      const ok = results.filter((r) => r.ok).length;
      const failed = results.filter((r) => !r.ok);
      if (ok > 0) {
        toast.success(
          `${ok} ${ok === 1 ? "evolução assinada" : "evoluções assinadas"}`,
          { description: signerName ? `Titular: ${signerName}` : undefined },
        );
      }
      if (failed.length > 0) {
        toast.error(
          `${failed.length} ${failed.length === 1 ? "evolução não pôde" : "evoluções não puderam"} ser assinada(s)`,
          { description: failed[0]?.error },
        );
      }
      if (failed.length === 0) {
        reset();
        onOpenChange(false);
      }
    } catch (e) {
      toast.error("Falha ao assinar", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setProgress(null);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (busy) return;
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-brand-blue-light" />
            Assinar evoluções
          </DialogTitle>
          <DialogDescription>
            Um único certificado A1 (e-CPF) assina todas as evoluções
            selecionadas — cada relatório recebe a própria assinatura,
            vinculada ao seu conteúdo. O arquivo e a senha são processados
            apenas neste dispositivo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl border border-border">
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
              <span className="text-sm font-semibold">
                Evoluções desta página
              </span>
              {eligible.length > 0 && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    setSelected(allSelected ? [] : eligible.map((r) => r.id))
                  }
                  className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
                >
                  {allSelected ? "Limpar seleção" : "Selecionar todas"}
                </button>
              )}
            </div>
            <ul className="max-h-64 divide-y divide-border overflow-y-auto">
              {rows.map((row) => {
                const ready = canSignMonthly(row);
                const signed = row.workflow_status === "assinada";
                return (
                  <li
                    key={row.id}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm"
                  >
                    <Checkbox
                      checked={selected.includes(row.id)}
                      disabled={!ready || busy}
                      onCheckedChange={(v) => toggle(row.id, v === true)}
                      aria-label={`Selecionar evolução de ${row.patient?.name ?? "paciente"}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {row.patient?.name ?? "—"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {formatMonthlyPeriod(row)}
                        {row.professional?.name
                          ? ` · ${row.professional.name}`
                          : ""}
                      </p>
                    </div>
                    {ready ? (
                      <Badge variant="accent">Pronta para assinar</Badge>
                    ) : (
                      <Badge variant={signed ? "success" : "muted"}>
                        {!signed && <Lock className="h-3 w-3" />}
                        {monthlyStatusLabels[row.workflow_status]}
                      </Badge>
                    )}
                  </li>
                );
              })}
              {rows.length === 0 && (
                <li className="px-4 py-6 text-center text-sm text-muted-foreground">
                  Nenhuma evolução nesta página.
                </li>
              )}
            </ul>
            {rows.length > 0 && eligible.length === 0 && (
              <p className="border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
                Só evoluções aprovadas pelo coordenador podem ser assinadas.
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Certificado (.pfx / .p12)">
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-input bg-background px-3.5 py-3 text-sm transition-colors hover:bg-secondary/50">
                <FileKey className="h-5 w-5 shrink-0 text-muted-foreground" />
                <span className="truncate">
                  {file ? file.name : "Selecionar arquivo do certificado"}
                </span>
                <input
                  type="file"
                  accept=".pfx,.p12,application/x-pkcs12"
                  className="hidden"
                  disabled={busy}
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </Field>
            <Field label="Senha do certificado">
              <Input
                type="password"
                value={password}
                autoComplete="off"
                disabled={busy}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha (PIN) do certificado"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSign();
                }}
              />
            </Field>
          </div>
        </div>

        <DialogFooter>
          {progress && (
            <p className="mr-auto text-xs tabular-nums text-muted-foreground">
              Assinando {progress.done} de {progress.total}...
            </p>
          )}
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Cancelar
          </Button>
          <Button
            variant="brand"
            onClick={handleSign}
            disabled={busy || !file || selected.length === 0}
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" /> Assinar{" "}
                {selected.length > 0 ? `(${selected.length})` : ""}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
