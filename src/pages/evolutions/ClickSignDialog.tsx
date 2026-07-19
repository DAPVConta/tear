import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Send,
  RefreshCw,
  CheckCircle2,
  FileSignature,
  Mail,
  Download,
} from "lucide-react";
import { format } from "date-fns";
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
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/form/Field";
import { maskCPF, isValidCPF, unmask } from "@/lib/masks";
import { parseDateOnly } from "@/lib/date";
import { useAuth } from "@/providers/AuthProvider";
import {
  getClickSignEnvelope,
  useRequestClickSignSignature,
  useRefreshClickSignStatus,
  useGetSignedDocumentUrl,
} from "@/features/dailyEvolutions/clicksign";
import type { EvolutionRow } from "@/features/dailyEvolutions/api";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evolution: EvolutionRow | null;
};

// Assinatura digital via ClickSign: gera o relatório da evolução em PDF e
// abre o envelope de assinatura — o signatário recebe o link por e-mail.
export function ClickSignDialog({ open, onOpenChange, evolution }: Props) {
  const { user, profile } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const request = useRequestClickSignSignature();
  const refresh = useRefreshClickSignStatus();
  const download = useGetSignedDocumentUrl();
  const busy = request.isPending || refresh.isPending || download.isPending;

  const envelope = getClickSignEnvelope(evolution);

  // Prefill do signatário: profissional da evolução; e-mail da sessão logada.
  useEffect(() => {
    if (!open || !evolution) return;
    setName(evolution.professional?.name || profile?.name || "");
    setEmail(user?.email ?? "");
    setCpf("");
    // Prefill apenas na abertura do diálogo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, evolution?.id]);

  async function handleRequest() {
    if (!evolution) return;
    if (!name.trim()) {
      toast.error("Informe o nome do signatário.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error("Informe um e-mail válido para receber o link de assinatura.");
      return;
    }
    if (cpf && !isValidCPF(unmask(cpf))) {
      toast.error("CPF inválido.");
      return;
    }
    try {
      const result = await request.mutateAsync({
        evolution,
        signerName: name.trim(),
        signerEmail: email.trim(),
        signerCpf: cpf || undefined,
      });
      toast.success("Documento enviado para assinatura", {
        description: `O link foi enviado para ${result.signer_email} via ClickSign.`,
      });
    } catch (e) {
      toast.error("Falha ao enviar para a ClickSign", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

  async function handleDownload() {
    if (!evolution) return;
    try {
      const url = await download.mutateAsync(evolution.id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      toast.error("Falha ao baixar o documento assinado", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

  async function handleRefresh() {
    if (!evolution) return;
    try {
      const result = await refresh.mutateAsync(evolution.id);
      if (result.status === "signed") {
        toast.success("Evolução assinada via ClickSign", {
          description: `Assinada por ${result.signer_name}.`,
        });
      } else {
        const envStatus = (result as { envelope_status?: string }).envelope_status;
        toast.info("Ainda aguardando assinatura", {
          description: `Situação do envelope na ClickSign: ${
            envStatus || "desconhecida"
          }. O link permanece ativo no e-mail ${result.signer_email}.`,
        });
      }
    } catch (e) {
      toast.error("Falha ao consultar o status", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

  const sessionLabel = evolution
    ? `${format(parseDateOnly(evolution.session_date), "dd/MM/yyyy")} · ${
        evolution.patient?.name ?? "—"
      }`
    : "";

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!busy) onOpenChange(v);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-brand-blue-light" />
            Assinatura via ClickSign
          </DialogTitle>
          <DialogDescription>
            {envelope
              ? `Relatório da sessão de ${sessionLabel}.`
              : `O sistema gera o relatório da evolução (${sessionLabel}) em PDF e envia para assinatura digital pela ClickSign. O signatário recebe o link por e-mail.`}
          </DialogDescription>
        </DialogHeader>

        {envelope ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-secondary/40 p-4 text-sm">
              <div className="mb-2">
                {envelope.status === "signed" ? (
                  <Badge variant="success">
                    <CheckCircle2 className="h-3 w-3" /> Assinada via ClickSign
                  </Badge>
                ) : (
                  <Badge variant="warning">
                    <Mail className="h-3 w-3" /> Aguardando assinatura
                  </Badge>
                )}
              </div>
              <div className="space-y-1 text-muted-foreground">
                <div>
                  Signatário:{" "}
                  <span className="font-medium text-foreground">
                    {envelope.signer_name}
                  </span>{" "}
                  · {envelope.signer_email}
                </div>
                <div>
                  Solicitada em{" "}
                  {new Date(envelope.requested_at).toLocaleString("pt-BR")}
                </div>
                {envelope.finished_at && (
                  <div>
                    Concluída em{" "}
                    {new Date(envelope.finished_at).toLocaleString("pt-BR")}
                  </div>
                )}
              </div>
            </div>
            {envelope.status === "pending" && (
              <p className="text-sm text-muted-foreground">
                O link de assinatura foi enviado por e-mail. Após assinar,
                clique em "Verificar status" para atualizar o registro.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Field label="Nome do signatário">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome completo"
              />
            </Field>
            <Field label="E-mail (recebe o link de assinatura)">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@clinica.com.br"
              />
            </Field>
            <Field label="CPF (opcional)">
              <Input
                value={cpf}
                inputMode="numeric"
                onChange={(e) => setCpf(maskCPF(e.target.value))}
                placeholder="000.000.000-00"
              />
            </Field>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Fechar
          </Button>
          {envelope ? (
            envelope.status === "signed" ? (
              <Button variant="brand" onClick={handleDownload} disabled={busy}>
                {download.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Download className="h-4 w-4" /> Baixar documento assinado
                  </>
                )}
              </Button>
            ) : (
              <Button variant="brand" onClick={handleRefresh} disabled={busy}>
                {refresh.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" /> Verificar status
                  </>
                )}
              </Button>
            )
          ) : (
            <Button variant="brand" onClick={handleRequest} disabled={busy}>
              {request.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="h-4 w-4" /> Enviar para assinatura
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
