import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { callRpc } from "@/lib/typedRpc";
import { keys } from "@/lib/queryKeys";
import { useClinic } from "@/providers/ClinicProvider";
import type { Enums, Tables, TablesInsert } from "@/types/database";

export type Correction = Tables<"corrections">;
export type CorrectionStatus = Enums<"correction_status">;

const CORRECTIONS_BUCKET = "correction-attachments";

// Lista as correções da clínica (mais recentes primeiro). Volume baixo —
// sem paginação server-side por ora.
export function useCorrections() {
  const { clinic } = useClinic();
  const clinicId = clinic?.id;
  return useQuery({
    queryKey: keys.corrections.list(clinicId),
    enabled: !!clinicId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("corrections")
        .select("*")
        .eq("clinic_id", clinicId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Correction[];
    },
  });
}

// Faz upload das imagens no bucket privado (pasta = clinic_id) e devolve os
// caminhos (paths) para gravar na correção. A exibição usa URLs assinadas.
export function useUploadCorrectionImages() {
  const { clinic } = useClinic();
  return useMutation({
    mutationFn: async (files: File[]) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      const paths: string[] = [];
      for (const file of files) {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
        const rand = Math.random().toString(36).slice(2, 8);
        const path = `${clinic.id}/correcao-${Date.now()}-${rand}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from(CORRECTIONS_BUCKET)
          .upload(path, file, { cacheControl: "3600" });
        if (upErr) throw upErr;
        paths.push(path);
      }
      return paths;
    },
  });
}

// Gera URLs assinadas (curta duração) para exibir os anexos de uma correção.
// O bucket é privado; cada path é resolvido sob demanda.
export function useCorrectionSignedUrls(paths: string[]) {
  return useQuery({
    queryKey: keys.corrections.signedUrls(paths),
    enabled: paths.length > 0,
    // Signed URLs valem 1h; revalida bem antes de expirar.
    staleTime: 50 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from(CORRECTIONS_BUCKET)
        .createSignedUrls(paths, 60 * 60);
      if (error) throw error;
      return (data ?? []).map((d) => d.signedUrl ?? null);
    },
  });
}

export function useCreateCorrection() {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();
  return useMutation({
    mutationFn: async (
      values: Pick<TablesInsert<"corrections">, "link" | "description" | "images">,
    ) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      // Gravação atômica e server-authoritative (clinic_id/created_by derivados
      // da sessão). Evita o estado fantasma de um insert que falha após o
      // upload das imagens.
      return callRpc<Correction>("save_correction", {
        p_clinic_id: clinic.id,
        p_description: values.description,
        p_link: values.link ?? null,
        p_images: values.images ?? [],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.corrections.all });
    },
  });
}

export function useUpdateCorrectionStatus() {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();
  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: number;
      status: CorrectionStatus;
    }) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      const { error } = await supabase
        .from("corrections")
        .update({ status } as never)
        .eq("id", id)
        .eq("clinic_id", clinic.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.corrections.all });
    },
  });
}

export function useDeleteCorrection() {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();
  return useMutation({
    mutationFn: async (id: number) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      const { error } = await supabase
        .from("corrections")
        .delete()
        .eq("id", id)
        .eq("clinic_id", clinic.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.corrections.all });
    },
  });
}
