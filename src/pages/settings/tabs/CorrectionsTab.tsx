import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Bug,
  CalendarDays,
  ImagePlus,
  Link2,
  Loader2,
  Send,
  Trash2,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Field } from "@/components/form/Field";
import { SectionTitle } from "@/components/form/SectionTitle";
import {
  ListEmptyState,
  ListErrorBanner,
} from "@/components/ui/list-states";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/providers/AuthProvider";
import {
  useCorrections,
  useCreateCorrection,
  useDeleteCorrection,
  useUpdateCorrectionStatus,
  useUploadCorrectionImages,
  type Correction,
  type CorrectionStatus,
} from "@/features/corrections/api";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGES = 6;

const STATUS_META: Record<
  CorrectionStatus,
  { label: string; variant: "warning" | "accent" | "success" | "muted" }
> = {
  aberto: { label: "Aberto", variant: "warning" },
  em_andamento: { label: "Em andamento", variant: "accent" },
  resolvido: { label: "Resolvido", variant: "success" },
  cancelado: { label: "Cancelado", variant: "muted" },
};

const STATUS_ORDER: CorrectionStatus[] = [
  "aberto",
  "em_andamento",
  "resolvido",
  "cancelado",
];

const schema = z.object({
  link: z
    .string()
    .trim()
    .url("Informe uma URL válida (https://...)")
    .or(z.literal(""))
    .optional(),
  description: z
    .string()
    .trim()
    .min(10, "Descreva o erro com pelo menos 10 caracteres"),
});

type FormValues = z.infer<typeof schema>;

type PendingImage = { file: File; preview: string };

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CorrectionsTab() {
  const { user, profile } = useAuth();
  const list = useCorrections();
  const createCorrection = useCreateCorrection();
  const uploadImages = useUploadCorrectionImages();

  const [pending, setPending] = useState<PendingImage[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { link: "", description: "" },
  });

  const userLabel = profile?.name ?? user?.email ?? "Usuário atual";
  const today = new Date().toLocaleDateString("pt-BR");
  const busy = isSubmitting || createCorrection.isPending || uploadImages.isPending;

  function onPickImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (fileRef.current) fileRef.current.value = "";
    if (!files.length) return;

    const accepted: PendingImage[] = [];
    for (const file of files) {
      if (pending.length + accepted.length >= MAX_IMAGES) {
        toast.error(`Máximo de ${MAX_IMAGES} imagens por correção`);
        break;
      }
      if (!file.type.startsWith("image/")) {
        toast.error(`"${file.name}" não é uma imagem`);
        continue;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        toast.error(`"${file.name}" excede 5 MB`);
        continue;
      }
      accepted.push({ file, preview: URL.createObjectURL(file) });
    }
    if (accepted.length) setPending((prev) => [...prev, ...accepted]);
  }

  function removePending(index: number) {
    setPending((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function onSubmit(values: FormValues) {
    try {
      let images: string[] = [];
      if (pending.length > 0) {
        images = await uploadImages.mutateAsync(pending.map((p) => p.file));
      }
      await createCorrection.mutateAsync({
        link: values.link?.trim() ? values.link.trim() : null,
        description: values.description.trim(),
        images,
      });
      toast.success("Correção registrada");
      pending.forEach((p) => URL.revokeObjectURL(p.preview));
      setPending([]);
      reset({ link: "", description: "" });
    } catch (e) {
      toast.error("Não foi possível registrar a correção", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <SectionTitle icon={Bug}>Registrar correção</SectionTitle>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Usuário">
                <div className="flex h-11 items-center gap-2 rounded-lg border border-input bg-muted/40 px-3.5 text-sm text-muted-foreground">
                  <User className="h-4 w-4 shrink-0 text-accent" />
                  <span className="truncate">{userLabel}</span>
                </div>
              </Field>
              <Field label="Data">
                <div className="flex h-11 items-center gap-2 rounded-lg border border-input bg-muted/40 px-3.5 text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4 shrink-0 text-accent" />
                  <span>{today}</span>
                </div>
              </Field>
            </div>

            <Field label="Link (página onde o erro ocorreu)" error={errors.link?.message}>
              <div className="relative">
                <Link2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  {...register("link")}
                  className="pl-10"
                  placeholder="https://app.tear.com.br/pacientes/123"
                  inputMode="url"
                />
              </div>
            </Field>

            <Field label="Descrição do erro" error={errors.description?.message}>
              <textarea
                {...register("description")}
                rows={4}
                className="flex w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm shadow-soft transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
                placeholder="Descreva o que aconteceu, o que era esperado e como reproduzir o problema..."
              />
            </Field>

            <Field label="Imagens (opcional)">
              <div className="space-y-3">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={onPickImages}
                />
                {pending.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {pending.map((p, i) => (
                      <div
                        key={p.preview}
                        className="group relative h-24 w-24 overflow-hidden rounded-xl border border-border bg-muted shadow-soft"
                      >
                        <img
                          src={p.preview}
                          alt={`Anexo ${i + 1}`}
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removePending(i)}
                          className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/55 text-white opacity-0 transition-opacity hover:bg-black/75 group-hover:opacity-100"
                          aria-label="Remover imagem"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileRef.current?.click()}
                  disabled={busy || pending.length >= MAX_IMAGES}
                >
                  <ImagePlus className="h-4 w-4" /> Adicionar imagens
                </Button>
                <p className="text-xs text-muted-foreground">
                  Até {MAX_IMAGES} imagens, máx. 5 MB cada. As imagens são
                  armazenadas com segurança no Supabase.
                </p>
              </div>
            </Field>

            <div className="flex justify-end">
              <Button type="submit" variant="brand" disabled={busy}>
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Registrar correção
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Correções registradas</CardTitle>
        </CardHeader>
        <CardContent>
          {list.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-xl" />
              ))}
            </div>
          ) : list.isError ? (
            <ListErrorBanner message="Não foi possível carregar as correções." />
          ) : (list.data?.length ?? 0) === 0 ? (
            <ListEmptyState
              icon={Bug}
              title="Nenhuma correção registrada"
              description="Use o formulário acima para reportar erros ou melhorias encontradas no sistema."
            />
          ) : (
            <ul className="space-y-3">
              {list.data!.map((c) => (
                <CorrectionRow key={c.id} correction={c} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CorrectionRow({ correction }: { correction: Correction }) {
  const updateStatus = useUpdateCorrectionStatus();
  const deleteCorrection = useDeleteCorrection();
  const meta = STATUS_META[correction.status];

  async function onChangeStatus(status: CorrectionStatus) {
    if (status === correction.status) return;
    try {
      await updateStatus.mutateAsync({ id: correction.id, status });
      toast.success("Status atualizado");
    } catch (e) {
      toast.error("Não foi possível atualizar o status", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

  async function onDelete() {
    try {
      await deleteCorrection.mutateAsync(correction.id);
      toast.success("Correção removida");
    } catch (e) {
      toast.error("Não foi possível remover", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

  return (
    <li className="rounded-xl border border-border bg-card p-4 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <Badge variant={meta.variant}>{meta.label}</Badge>
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" />
            {formatDateTime(correction.created_at)}
          </span>
          <span className="inline-flex items-center gap-1">
            <User className="h-3.5 w-3.5" />
            {correction.created_by_name ?? "—"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={correction.status}
            onValueChange={(v) => onChangeStatus(v as CorrectionStatus)}
            disabled={updateStatus.isPending}
          >
            <SelectTrigger className="h-9 w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_ORDER.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_META[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive"
                aria-label="Remover correção"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remover correção?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. O registro será excluído
                  permanentemente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Remover
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <p className="mt-3 whitespace-pre-wrap text-sm text-foreground">
        {correction.description}
      </p>

      {correction.link && (
        <a
          href={correction.link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex max-w-full items-center gap-1.5 truncate text-xs font-medium text-accent hover:underline"
        >
          <Link2 className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{correction.link}</span>
        </a>
      )}

      {correction.images.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {correction.images.map((url, i) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="h-20 w-20 overflow-hidden rounded-lg border border-border bg-muted transition-transform hover:scale-[1.03]"
            >
              <img
                src={url}
                alt={`Anexo ${i + 1}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </a>
          ))}
        </div>
      )}
    </li>
  );
}
