import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { keys } from "@/lib/queryKeys";
import { useAuth } from "@/providers/AuthProvider";
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

// Faz upload das imagens no bucket (pasta = clinic_id) e devolve as URLs
// públicas para gravar junto da correção.
export function useUploadCorrectionImages() {
  const { clinic } = useClinic();
  return useMutation({
    mutationFn: async (files: File[]) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      const urls: string[] = [];
      for (const file of files) {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
        const rand = Math.random().toString(36).slice(2, 8);
        const path = `${clinic.id}/correcao-${Date.now()}-${rand}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from(CORRECTIONS_BUCKET)
          .upload(path, file, { cacheControl: "3600" });
        if (upErr) throw upErr;
        const { data } = supabase.storage
          .from(CORRECTIONS_BUCKET)
          .getPublicUrl(path);
        urls.push(data.publicUrl);
      }
      return urls;
    },
  });
}

export function useCreateCorrection() {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();
  const { user, profile } = useAuth();
  return useMutation({
    mutationFn: async (
      values: Pick<TablesInsert<"corrections">, "link" | "description" | "images">,
    ) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      const { error } = await supabase.from("corrections").insert({
        ...values,
        clinic_id: clinic.id,
        created_by: user?.id ?? null,
        created_by_name: profile?.name ?? user?.email ?? null,
      } as never);
      if (error) throw error;
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
