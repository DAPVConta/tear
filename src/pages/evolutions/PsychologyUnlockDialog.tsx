import { useEffect, useState } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/form/Field";
import { usePsychologyUnlock } from "@/features/dailyEvolutions/psychologyUnlock";
import { useClinic } from "@/providers/ClinicProvider";

// Modal de reautenticação para acessar registros sigilosos de Psicologia
// (correção #17 — sigilo CFP/LGPD). A RLS já filtra; este modal é o gate de
// intenção: o usuário autorizado reconfirma a senha antes de ler o conteúdo.
// O destravamento persiste pela aba do navegador (sessionStorage).
export function PsychologyUnlockDialog({
  open,
  onOpenChange,
  onUnlocked,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onUnlocked?: () => void;
}) {
  const { clinic } = useClinic();
  const { unlock } = usePsychologyUnlock(clinic?.id);
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) {
      setPassword("");
      setPending(false);
    }
  }, [open]);

  async function onSubmit() {
    if (!password) return;
    setPending(true);
    try {
      await unlock(password);
      toast.success("Sessão da Psicologia liberada nesta aba");
      onUnlocked?.();
      onOpenChange(false);
    } catch (e) {
      toast.error("Senha incorreta", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-warning-text" />
            Sigilo Psicológico — confirme sua identidade
          </DialogTitle>
          <DialogDescription>
            Resoluções do CFP e a LGPD exigem confirmação individual antes de
            acessar evoluções de psicologia. Digite a sua senha para liberar a
            visualização nesta aba do navegador.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="space-y-3"
        >
          <Field label="Sua senha">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </Field>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="brand" disabled={pending || !password}>
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Liberar acesso"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
