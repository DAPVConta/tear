import { useState } from "react";
import { toast } from "sonner";
import { Download, Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useExportMyData,
  useMyDeletionRequest,
  useRequestDataDeletion,
} from "@/features/lgpd/api";

export function PrivacyTab() {
  const exportData = useExportMyData();
  const requestDeletion = useRequestDataDeletion();
  const { data: lastRequest } = useMyDeletionRequest();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reason, setReason] = useState("");

  async function onExport() {
    try {
      const data = await exportData.mutateAsync();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tear-meus-dados-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Exportação concluída");
    } catch (e) {
      toast.error("Falha ao exportar", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

  async function onRequest() {
    try {
      await requestDeletion.mutateAsync(reason || undefined);
      toast.success("Solicitação registrada");
      setConfirmOpen(false);
      setReason("");
    } catch (e) {
      toast.error("Não foi possível registrar", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

  const hasPending = lastRequest?.status === "pending";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Exportar meus dados</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Baixe em JSON o seu perfil, vínculos com clínicas e solicitações
            registradas (LGPD Art. 18 II — portabilidade).
          </p>
          <Button
            type="button"
            variant="brand"
            onClick={onExport}
            disabled={exportData.isPending}
          >
            {exportData.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Download className="h-4 w-4" /> Exportar JSON
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Solicitar exclusão dos meus dados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Você pode pedir o apagamento da sua conta a qualquer momento
            (LGPD Art. 18 IV). Prontuários clínicos seguem a retenção legal
            mínima de 20 anos exigida pela Resolução CFM nº 1.821/2007;
            dados pessoais que não estiverem sujeitos a essa retenção serão
            removidos.
          </p>
          {hasPending ? (
            <div className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm text-amber-700">
              <p className="font-semibold">
                Você já tem uma solicitação pendente.
              </p>
              <p className="mt-1 opacity-80">
                Registrada em{" "}
                {new Date(lastRequest!.requested_at).toLocaleString("pt-BR")}
                . A plataforma processará em até 15 dias.
              </p>
            </div>
          ) : (
            <Button
              type="button"
              variant="destructive"
              onClick={() => setConfirmOpen(true)}
            >
              <ShieldAlert className="h-4 w-4" /> Solicitar exclusão
            </Button>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Solicitar exclusão da conta?</AlertDialogTitle>
            <AlertDialogDescription>
              Você pode incluir um motivo (opcional). A plataforma terá até
              15 dias para responder, respeitando a retenção legal de
              prontuários.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Motivo (opcional)"
            className="flex w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={onRequest}
              disabled={requestDeletion.isPending}
            >
              Confirmar solicitação
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
