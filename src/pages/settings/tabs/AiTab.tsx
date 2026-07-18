import { useState } from "react";
import { toast } from "sonner";
import {
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field } from "@/components/form/Field";
import { useClinic } from "@/providers/ClinicProvider";
import {
  useClinicAiSettings,
  useSaveOpenaiToken,
} from "@/features/ai/api";

export function AiTab() {
  const { role } = useClinic();
  const isAdmin = role === "clinic_admin";
  const { data: settings, isLoading } = useClinicAiSettings();
  const saveToken = useSaveOpenaiToken();

  const [token, setToken] = useState("");
  const [reveal, setReveal] = useState(false);

  const configured = settings?.configured ?? false;

  async function onSave() {
    if (!token.trim()) {
      toast.error("Informe o token para salvar");
      return;
    }
    try {
      await saveToken.mutateAsync(token);
      setToken("");
      setReveal(false);
      toast.success("Token GPT salvo");
    } catch (e) {
      toast.error("Falha ao salvar o token", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

  async function onRemove() {
    try {
      await saveToken.mutateAsync(null);
      setToken("");
      toast.success("Token GPT removido");
    } catch (e) {
      toast.error("Falha ao remover", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

  return (
    <div className="space-y-6">
      {!isAdmin && (
        <div className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-amber-700">
          Somente administradores da clínica podem configurar o token de IA.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand-blue-light" />
            Inteligência Artificial (OpenAI)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Informe o token da OpenAI (GPT-4o mini) da sua clínica. Ele é usado
            para <strong>ler o laudo no cadastro de pacientes</strong> e
            preencher automaticamente o nome e as terapias recomendadas. A chave
            fica protegida no servidor (só administradores a gerenciam) e nunca
            é exibida novamente após salva.
          </p>

          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3.5 py-2.5 text-sm">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : configured ? (
              <>
                <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span className="font-medium text-foreground">
                  Token configurado
                </span>
                <span className="text-muted-foreground">
                  · a IA está ativa no cadastro de pacientes
                </span>
              </>
            ) : (
              <>
                <span className="grid h-6 w-6 place-items-center rounded-full bg-amber-100 text-amber-700">
                  <KeyRound className="h-3.5 w-3.5" />
                </span>
                <span className="font-medium text-foreground">
                  Nenhum token configurado
                </span>
                <span className="text-muted-foreground">
                  · a leitura por IA fica indisponível
                </span>
              </>
            )}
          </div>

          <Field label={configured ? "Substituir token (token_gpt)" : "Token (token_gpt)"}>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={reveal ? "text" : "password"}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="sk-..."
                  disabled={!isAdmin || saveToken.isPending}
                  autoComplete="off"
                  className="pr-10 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setReveal((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={reveal ? "Ocultar token" : "Mostrar token"}
                  tabIndex={-1}
                >
                  {reveal ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <Button
                type="button"
                variant="brand"
                onClick={onSave}
                disabled={!isAdmin || saveToken.isPending || !token.trim()}
              >
                {saveToken.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Salvar
                  </>
                )}
              </Button>
            </div>
          </Field>

          {configured && (
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onRemove}
                disabled={!isAdmin || saveToken.isPending}
              >
                <Trash2 className="h-4 w-4" /> Remover token
              </Button>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Privacidade/LGPD: ao usar a leitura por IA, o documento do laudo é
            enviado à OpenAI (provedor externo) apenas para extração. Uso é
            opt-in por clique no cadastro do paciente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
