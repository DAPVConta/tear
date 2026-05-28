import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Image as ImageIcon,
  Loader2,
  RotateCcw,
  Save,
  Upload,
  Palette,
  Trash2,
  Download,
  ShieldAlert,
  Lock,
} from "lucide-react";
import { HexColorPicker } from "react-colorful";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { Field } from "@/components/form/Field";
import { Logo } from "@/components/brand/Logo";
import { useClinic } from "@/providers/ClinicProvider";
import {
  useUpdateClinicTheme,
  useUploadClinicLogo,
  useRemoveClinicLogo,
} from "@/features/clinic/api";
import {
  useExportMyData,
  useMyDeletionRequest,
  useRequestDataDeletion,
} from "@/features/lgpd/api";
import {
  TEAR_DEFAULTS,
  isValidHex,
  type ClinicTheme,
} from "@/lib/colors";

export default function SettingsPage() {
  const { clinic, role } = useClinic();
  const updateTheme = useUpdateClinicTheme();
  const uploadLogo = useUploadClinicLogo();
  const removeLogo = useRemoveClinicLogo();

  const currentTheme = (clinic?.theme ?? {}) as ClinicTheme;
  const [primary, setPrimary] = useState(currentTheme.primary ?? TEAR_DEFAULTS.primary);
  const [accent, setAccent] = useState(currentTheme.accent ?? TEAR_DEFAULTS.accent);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPrimary(currentTheme.primary ?? TEAR_DEFAULTS.primary);
    setAccent(currentTheme.accent ?? TEAR_DEFAULTS.accent);
  }, [currentTheme.primary, currentTheme.accent]);

  const isAdmin = role === "clinic_admin";

  async function saveColors() {
    if (!isValidHex(primary) || !isValidHex(accent)) {
      toast.error("Cores inválidas", {
        description: "Use o formato #RRGGBB.",
      });
      return;
    }
    try {
      await updateTheme.mutateAsync({ primary, accent });
      toast.success("Identidade atualizada");
    } catch (e) {
      toast.error("Falha ao salvar", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

  async function resetTheme() {
    try {
      await updateTheme.mutateAsync({});
      toast.success("Cores restauradas para o padrão TEAR");
    } catch (e) {
      toast.error("Falha ao restaurar", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx. 2 MB)");
      return;
    }
    try {
      await uploadLogo.mutateAsync(file);
      toast.success("Logo atualizada");
    } catch (err) {
      toast.error("Falha no upload", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function onRemoveLogo() {
    try {
      await removeLogo.mutateAsync();
      toast.success("Logo removida");
    } catch (e) {
      toast.error("Falha ao remover", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

  return (
    <div>
      <PageHeader
        title="Configurações"
        description="Preferências da clínica, identidade visual e papéis."
      />

      <Tabs defaultValue="layout">
        <TabsList>
          <TabsTrigger value="layout">
            <Palette className="mr-1 h-4 w-4" /> Layout
          </TabsTrigger>
          <TabsTrigger value="privacy">
            <Lock className="mr-1 h-4 w-4" /> Privacidade (LGPD)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="layout" className="space-y-6">
          {!isAdmin && (
            <div className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-amber-700">
              Somente administradores da clínica podem alterar a identidade
              visual. Você pode visualizar a configuração atual.
            </div>
          )}

          {/* Logo */}
          <Card>
            <CardHeader>
              <CardTitle>Logo da clínica</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-[auto_1fr]">
              <div className="grid h-32 w-32 place-items-center rounded-2xl border border-border bg-background shadow-soft">
                {clinic?.logo_url ? (
                  <img
                    src={clinic.logo_url}
                    alt="Logo atual"
                    className="max-h-28 max-w-28 object-contain"
                  />
                ) : (
                  <Logo />
                )}
              </div>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Substitua a marca do TEAR pela logo da sua clínica. Recomendado
                  PNG ou SVG transparente, até 2 MB.
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onFileChange}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="brand"
                    onClick={() => fileRef.current?.click()}
                    disabled={!isAdmin || uploadLogo.isPending}
                  >
                    {uploadLogo.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Upload className="h-4 w-4" /> Enviar nova logo
                      </>
                    )}
                  </Button>
                  {clinic?.logo_url && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onRemoveLogo}
                      disabled={!isAdmin || removeLogo.isPending}
                    >
                      <Trash2 className="h-4 w-4" /> Remover
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cores */}
          <Card>
            <CardHeader>
              <CardTitle>Paleta da clínica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <ColorField
                  label="Cor primária (dominante)"
                  value={primary}
                  onChange={setPrimary}
                  disabled={!isAdmin}
                />
                <ColorField
                  label="Cor de destaque (ações)"
                  value={accent}
                  onChange={setAccent}
                  disabled={!isAdmin}
                />
              </div>

              <Preview primary={primary} accent={accent} />

              <div className="flex flex-wrap justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetTheme}
                  disabled={!isAdmin || updateTheme.isPending}
                >
                  <RotateCcw className="h-4 w-4" /> Restaurar padrão TEAR
                </Button>
                <Button
                  type="button"
                  variant="brand"
                  onClick={saveColors}
                  disabled={!isAdmin || updateTheme.isPending}
                >
                  {updateTheme.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="h-4 w-4" /> Salvar cores
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <PrivacyPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PrivacyPanel() {
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
      a.download = `tear-meus-dados-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
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
    <>
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
    </>
  );
}

function ColorField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-3">
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={disabled}
              className="relative grid h-11 w-14 cursor-pointer place-items-center overflow-hidden rounded-lg border border-input shadow-soft transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={`Escolher ${label.toLowerCase()}`}
            >
              <span
                className="h-full w-full"
                style={{ backgroundColor: value }}
                aria-hidden
              />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
            <HexColorPicker color={value} onChange={onChange} />
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="#001F6B"
              className="mt-3 font-mono uppercase"
              maxLength={7}
            />
          </PopoverContent>
        </Popover>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="#001F6B"
          className="font-mono uppercase"
          maxLength={7}
        />
      </div>
    </Field>
  );
}

function Preview({ primary, accent }: { primary: string; accent: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <div
        className="flex items-center gap-4 p-6 text-white"
        style={{
          background: `linear-gradient(135deg, ${primary} 0%, ${accent} 100%)`,
        }}
      >
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15">
          <ImageIcon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest opacity-70">
            Pré-visualização
          </p>
          <p className="font-display text-xl font-extrabold">
            Identidade aplicada
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 bg-card p-5">
        <button
          type="button"
          className="rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-soft"
          style={{ backgroundColor: primary }}
        >
          Ação primária
        </button>
        <button
          type="button"
          className="rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-soft"
          style={{ backgroundColor: accent }}
        >
          Ação de destaque
        </button>
        <span
          className="rounded-full border px-3 py-1 text-xs font-semibold"
          style={{ color: accent, borderColor: accent }}
        >
          Realce
        </span>
      </div>
    </div>
  );
}
