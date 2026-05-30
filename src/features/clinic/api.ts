import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { keys } from "@/lib/queryKeys";
import { useClinic } from "@/providers/ClinicProvider";
import type { ClinicTheme } from "@/lib/colors";

export function useUpdateClinicTheme() {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();
  return useMutation({
    mutationFn: async (theme: ClinicTheme) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      const { error } = await supabase
        .from("clinics")
        .update({ theme })
        .eq("id", clinic.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.currentClinic.all });
    },
  });
}

export function useUploadClinicLogo() {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();
  return useMutation({
    mutationFn: async (file: File) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
      const path = `${clinic.id}/logo-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("clinic-assets")
        .upload(path, file, { upsert: true, cacheControl: "3600" });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("clinic-assets").getPublicUrl(path);
      const publicUrl = data.publicUrl;
      const { error } = await supabase
        .from("clinics")
        .update({ logo_url: publicUrl })
        .eq("id", clinic.id);
      if (error) throw error;
      return publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.currentClinic.all });
    },
  });
}

export function useRemoveClinicLogo() {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();
  return useMutation({
    mutationFn: async () => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      const { error } = await supabase
        .from("clinics")
        .update({ logo_url: null })
        .eq("id", clinic.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.currentClinic.all });
    },
  });
}
