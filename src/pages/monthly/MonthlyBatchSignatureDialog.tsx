import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, ShieldCheck, FileKey, Lock, PenLine } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { monthlyStatusLabels } from "@/lib/labels";
import {
  canSignMonthly,
  formatMonthlyPeriod,
  hasProfessionalRubric,
  useSignMonthlyBatch,
  type MonthlyRow,
  type MonthlySignatureMethod,
} from "@/features/monthlyEvolutions/api";

const METHODS: {
  value: MonthlySignatureMethod;
  label: string;
  hint: string;
  icon: typeof ShieldCheck;
}[] = [
  {
    value: "certificado",
    label: "Assinar com certificado",
    hint: "Certificado A1 ICP-Brasil (e-CPF)",
    icon: ShieldCheck,
  },
  {
    value: "digital",
    label: "Assinatura digital",
    hint: "Assinatura do cadastro do profissional",
    icon: PenLine,
  },
];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Linhas exibidas na listagem — as elegíveis vêm marcadas por padrão.
  rows: MonthlyRow[];
};

export function MonthlyBatchSignatureDialog({ open, onOpenChange, rows }: Props) {
  const [method, setMethod] = useState<MonthlySignatureMethod>("certificado");
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(
    null,
  );
  const batch = useSignMonthlyBatch();
  const busy = batch.isPending;
  const withCertificate = method === "certificado";

  // Elegibilidade depende do método: a assinatura digital exige que o
  // profissional daquele relatório tenha rubrica cadastrada.
  const eligible = useMemo(
    () =>
      rows.filter(
        (r) => canSignMonthly(r) && (withCertificate || hasProfessionalRubric(r)),
      ),
    [rows, withCertificate],
  );
  const eligibleRef = useRef(eligible);
  eligibleRef.current = eligible;

  // Ao abrir (ou ao trocar de método) tudo que está pronto para assinar vem
  // marcado. Depois disso a escolha é do usuário — um refetch não mexe nela.
  useEffect(() => {
    if (open) setSelected(eligibleRef.current.map((r) => r.id));
  }, [open, method]);

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
    if (withCertificate && !file) {
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
        method,
        file: withCertificate ? file : null,
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
            {withCertificate
              ? "Um único certificado A1 (e-CPF) assina todas as evoluções selecionadas — cada relatório recebe a própria assinatura, vinculada ao seu conteúdo. O arquivo e a senha são processados apenas neste dispositivo."
              : "Cada relatório selecionado recebe a assinatura digitalizada do profissional responsável, com registro de data e hora."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div
            role="radiogroup"
            aria-label="Forma de assinatura"
            className="grid gap-3 sm:grid-cols-2"
          >
            {METHODS.map((m) => {
              const active = method === m.value;
              const Icon = m.icon;
              return (
                <button
                  key={m.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={busy}
                  onClick={() => setMethod(m.value)}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60",
                    active
                      ? "border-primary bg-primary/5 shadow-soft"
                      : "border-border bg-background hover:border-primary/40 hover:bg-secondary/40",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{m.label}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {m.hint}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

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
                const approved = canSignMonthly(row);
                const missingRubric = !withCertificate && !hasProfessionalRubric(row);
                const ready = approved && !missingRubric;
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
                    ) : missingRubric && approved ? (
                      <Badge variant="warning">
                        <Lock className="h-3 w-3" />
                        Sem assinatura cadastrada
                      </Badge>
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
                Só evoluções aprovadas pelo coordenador podem ser assinadas
                {withCertificate
                  ? "."
                  : " — e, nesta forma, o profissional precisa ter assinatura digitalizada no cadastro."}
              </p>
            )}
          </div>

          <div
            className={cn("grid gap-4 sm:grid-cols-2", !withCertificate && "hidden")}
          >
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
            disabled={
              busy || (withCertificate && !file) || selected.length === 0
            }
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                {withCertificate ? (
                  <ShieldCheck className="h-4 w-4" />
                ) : (
                  <PenLine className="h-4 w-4" />
                )}
                Assinar {selected.length > 0 ? `(${selected.length})` : ""}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
