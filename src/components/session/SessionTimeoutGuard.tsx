import { useCallback, useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";
import { toast } from "sonner";
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
  ACTIVITY_THROTTLE_MS,
  IDLE_CHECK_INTERVAL_MS,
  IDLE_TIMEOUT_MS,
  IDLE_WARNING_MS,
} from "@/config/session";
import { useAuth } from "@/providers/AuthProvider";

// Eventos que contam como presença do usuário. `visibilitychange` cobre voltar
// para a aba; `focus`, voltar para a janela.
const ACTIVITY_EVENTS = [
  "pointerdown",
  "keydown",
  "wheel",
  "touchstart",
  "focus",
] as const;

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return minutes > 0
    ? `${minutes}min ${String(seconds).padStart(2, "0")}s`
    : `${seconds}s`;
}

// Encerra a sessão após IDLE_TIMEOUT_MS sem interação, avisando antes. A
// contagem começa a cada carregamento da página: o objetivo é proteger a tela
// aberta e desatendida na clínica, não punir quem volta no dia seguinte com
// "lembrar-me" ligado.
export function SessionTimeoutGuard() {
  const { session, signOut } = useAuth();
  const lastActivity = useRef(Date.now());
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const loggingOut = useRef(false);

  const warning = remainingMs !== null;

  const markActivity = useCallback(() => {
    const now = Date.now();
    if (now - lastActivity.current < ACTIVITY_THROTTLE_MS) return;
    lastActivity.current = now;
  }, []);

  // Registra atividade enquanto houver sessão. Durante o aviso o rastreamento
  // pausa: sair da contagem exige uma confirmação explícita — mexer o mouse
  // sem ninguém na frente da tela não deve renovar a sessão.
  useEffect(() => {
    if (!session || warning) return;
    lastActivity.current = Date.now();

    const onVisible = () => {
      if (document.visibilityState === "visible") markActivity();
    };
    for (const evt of ACTIVITY_EVENTS) {
      window.addEventListener(evt, markActivity, { passive: true });
    }
    window.addEventListener("mousemove", markActivity, { passive: true });
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      for (const evt of ACTIVITY_EVENTS) {
        window.removeEventListener(evt, markActivity);
      }
      window.removeEventListener("mousemove", markActivity);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [session, warning, markActivity]);

  useEffect(() => {
    if (!session) {
      setRemainingMs(null);
      loggingOut.current = false;
      return;
    }

    const tick = async () => {
      const idle = Date.now() - lastActivity.current;
      const left = IDLE_TIMEOUT_MS - idle;

      if (left <= 0) {
        if (loggingOut.current) return;
        loggingOut.current = true;
        setRemainingMs(null);
        await signOut();
        toast.info("Sessão encerrada por inatividade", {
          description: "Entre novamente para continuar de onde parou.",
        });
        return;
      }
      setRemainingMs(left <= IDLE_WARNING_MS ? left : null);
    };

    void tick();
    const id = window.setInterval(() => void tick(), IDLE_CHECK_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [session, signOut]);

  function stayConnected() {
    lastActivity.current = Date.now();
    setRemainingMs(null);
  }

  return (
    <AlertDialog open={warning}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-warning-text" />
            Sua sessão vai encerrar
          </AlertDialogTitle>
          <AlertDialogDescription>
            Não detectamos atividade. Por segurança dos dados dos pacientes, a
            sessão será encerrada em{" "}
            <span className="font-semibold tabular-nums text-foreground">
              {formatCountdown(remainingMs ?? 0)}
            </span>
            .
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => void signOut()}>
            Sair agora
          </AlertDialogCancel>
          <AlertDialogAction onClick={stayConnected}>
            Continuar conectado
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
