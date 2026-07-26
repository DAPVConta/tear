import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { keys } from "@/lib/queryKeys";
import {
  fetchActiveOptions,
  fetchPaginatedList,
  fetchRecordById,
  insertRecord,
  setActive,
  updateRecord,
} from "@/lib/crud";
import { useAuth } from "@/providers/AuthProvider";
import { useClinic } from "@/providers/ClinicProvider";
import type { Enums, Tables, TablesInsert, TablesUpdate } from "@/types/database";

export type Professional = Tables<"professionals">;
export type Specialty = Enums<"specialty">;
export const PROFESSIONALS_PAGE_SIZE = 10;

// Especialidades (N:N) de um profissional.
export function useProfessionalSpecialties(professionalId: number | undefined) {
  const { clinic } = useClinic();
  return useQuery({
    queryKey: ["professional-specialties", professionalId],
    enabled: !!professionalId && !!clinic?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professional_specialties")
        .select("specialty")
        .eq("professional_id", professionalId!)
        .eq("clinic_id", clinic!.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.specialty as Specialty);
    },
  });
}

// Reconcilia (insere/remove) as especialidades do profissional.
export function useSaveProfessionalSpecialties() {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();
  return useMutation({
    mutationFn: async ({
      professionalId,
      specialties,
    }: {
      professionalId: number;
      specialties: Specialty[];
    }) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      const { data: current, error: fetchErr } = await supabase
        .from("professional_specialties")
        .select("id, specialty")
        .eq("professional_id", professionalId)
        .eq("clinic_id", clinic.id);
      if (fetchErr) throw fetchErr;
      const existing = (current ?? []) as { id: number; specialty: Specialty }[];
      const existingSet = new Set(existing.map((e) => e.specialty));
      const wanted = new Set(specialties);
      const toInsert = specialties.filter((s) => !existingSet.has(s));
      const toDelete = existing.filter((e) => !wanted.has(e.specialty));
      if (toInsert.length) {
        const { error } = await supabase.from("professional_specialties").insert(
          toInsert.map((s) => ({
            clinic_id: clinic.id,
            professional_id: professionalId,
            specialty: s,
          })) as never,
        );
        if (error) throw error;
      }
      if (toDelete.length) {
        const { error } = await supabase
          .from("professional_specialties")
          .delete()
          .in(
            "id",
            toDelete.map((e) => e.id),
          );
        if (error) throw error;
      }
    },
    onSuccess: (_d, { professionalId }) => {
      queryClient.invalidateQueries({
        queryKey: ["professional-specialties", professionalId],
      });
    },
  });
}

// --- Assinatura digitalizada (rubrica) do profissional ---------------------
// Bucket PRIVADO; a pasta raiz é o clinic_id (RLS por clínica). A imagem é
// aplicada nos relatórios que o profissional assina (evolução diária/mensal).
// Não substitui a assinatura ICP-Brasil: é o elemento visual do documento.
const SIGNATURES_BUCKET = "professional-signatures";

export const SIGNATURE_ACCEPT = "image/png,image/jpeg";
export const SIGNATURE_MAX_BYTES = 2 * 1024 * 1024;

// Sobe a imagem e devolve o caminho para gravar em professionals.signature_path.
export function useUploadProfessionalSignature() {
  const { clinic } = useClinic();
  return useMutation({
    mutationFn: async (file: File) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      if (file.size > SIGNATURE_MAX_BYTES)
        throw new Error("A imagem deve ter no máximo 2 MB.");
      const ext = file.type === "image/png" ? "png" : "jpg";
      const rand = Math.random().toString(36).slice(2, 8);
      const path = `${clinic.id}/assinatura-${Date.now()}-${rand}.${ext}`;
      const { error } = await supabase.storage
        .from(SIGNATURES_BUCKET)
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) throw error;
      return path;
    },
  });
}

// Baixa a rubrica e devolve um data URL — formato exigido pelo jsPDF
// (addImage) e usado também na pré-visualização do cadastro.
export async function fetchSignatureDataUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(SIGNATURES_BUCKET)
    .download(path);
  if (error) throw error;
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Falha ao ler a imagem"));
    reader.readAsDataURL(data);
  });
}

export function useProfessionalSignatureImage(path: string | null | undefined) {
  return useQuery({
    queryKey: ["professional-signature", path],
    enabled: !!path,
    staleTime: 30 * 60 * 1000,
    queryFn: () => fetchSignatureDataUrl(path!),
  });
}

// Apaga o arquivo da rubrica. Best-effort: usado ao substituir a imagem, para
// não deixar arquivo órfão no bucket; a falha não interrompe o fluxo.
export async function deleteSignatureFile(path: string): Promise<void> {
  await supabase.storage.from(SIGNATURES_BUCKET).remove([path]);
}

// Remove a rubrica do Storage e limpa a coluna. Idempotente: se o arquivo já
// não existir, a coluna é limpa mesmo assim.
export function useRemoveProfessionalSignature() {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();
  return useMutation({
    mutationFn: async ({ id, path }: { id: number; path: string }) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      await deleteSignatureFile(path);
      await updateRecord<Professional>({
        table: "professionals",
        id,
        clinicId: clinic.id,
        values: { signature_path: null },
      });
    },
    onSuccess: (_d, { id, path }) => {
      queryClient.invalidateQueries({ queryKey: ["professional-signature", path] });
      queryClient.invalidateQueries({ queryKey: keys.professionals.all });
      queryClient.invalidateQueries({ queryKey: keys.professionals.byId(id) });
    },
  });
}

export type ProfessionalStatusFilter = "active" | "inactive" | "all";

type ListParams = {
  search: string;
  page: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  status?: ProfessionalStatusFilter;
};

export function useProfessionals({
  search,
  page,
  sortBy = "name",
  sortDir = "asc",
  status = "active",
}: ListParams) {
  const { clinic } = useClinic();
  const clinicId = clinic?.id;
  return useQuery({
    queryKey: keys.professionals.list(clinicId, search, page, sortBy, sortDir, status),
    enabled: !!clinicId,
    queryFn: () =>
      fetchPaginatedList<Professional>({
        table: "professionals",
        clinicId: clinicId!,
        page,
        pageSize: PROFESSIONALS_PAGE_SIZE,
        search,
        searchColumns: ["name", "council_number", "cpf"],
        order: { column: sortBy, ascending: sortDir === "asc" },
        // "all" não filtra; caso contrário, ativos ou inativos. Inativar é
        // soft-delete (preserva histórico de prontuários/evoluções), nunca
        // exclusão.
        filters:
          status === "all"
            ? []
            : [{ column: "active", op: "eq", value: status === "active" }],
      }),
  });
}

// Opções leves (id + nome + especialidade) para seletores em outros módulos.
export function useProfessionalOptions() {
  const { clinic } = useClinic();
  const clinicId = clinic?.id;
  return useQuery({
    queryKey: keys.professionals.options(clinicId),
    enabled: !!clinicId,
    queryFn: () =>
      fetchActiveOptions<Pick<Professional, "id" | "name" | "specialty">>({
        table: "professionals",
        clinicId: clinicId!,
        columns: "id, name, specialty",
      }),
  });
}

// Profissional vinculado ao usuário logado (para checar papel de coordenador).
export function useMyProfessional() {
  const { clinic } = useClinic();
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-professional", clinic?.id, user?.id],
    enabled: !!clinic?.id && !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professionals")
        .select("id, name, specialty, coordinator_specialty, is_at_supervisor")
        .eq("clinic_id", clinic!.id)
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useProfessional(id: number | undefined) {
  const { clinic } = useClinic();
  return useQuery({
    queryKey: keys.professionals.byId(id),
    enabled: !!id && !!clinic?.id,
    queryFn: () =>
      fetchRecordById<Professional>({
        table: "professionals",
        id: id!,
        clinicId: clinic!.id,
      }),
  });
}

export function useCreateProfessional() {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (
      values: Omit<TablesInsert<"professionals">, "clinic_id" | "created_by">,
    ) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      return insertRecord<Professional>({
        table: "professionals",
        values: values as Record<string, unknown>,
        clinicId: clinic.id,
        createdBy: user?.id ?? null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.professionals.all });
    },
  });
}

export function useUpdateProfessional(id: number) {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();
  return useMutation({
    mutationFn: (values: TablesUpdate<"professionals">) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      return updateRecord<Professional>({
        table: "professionals",
        id,
        clinicId: clinic.id,
        values: values as Record<string, unknown>,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.professionals.all });
      queryClient.invalidateQueries({ queryKey: keys.professionals.byId(id) });
    },
  });
}

// Ativa/inativa o profissional (soft-delete reversível). Inativar bloqueia o
// uso operacional (some dos seletores de novos atendimentos/evoluções); o
// histórico permanece intacto. Reativar restaura imediatamente.
//
// Se houver conta de acesso vinculada (user_id) e o operador for admin, o
// status do MEMBRO é sincronizado: inativar o profissional revoga o acesso ao
// sistema; reativar restaura. Há proteção para não derrubar o último admin.
export function useSetProfessionalActive() {
  const queryClient = useQueryClient();
  const { clinic, role } = useClinic();
  return useMutation({
    mutationFn: async ({
      id,
      active,
      userId,
    }: {
      id: number;
      active: boolean;
      userId?: string | null;
    }) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      const result = await setActive({
        table: "professionals",
        id,
        clinicId: clinic.id,
        active,
      });

      // Sincroniza o acesso do membro vinculado (só admin pode; RLS exige).
      if (userId && role === "clinic_admin") {
        if (!active) {
          // Não derrubar o último administrador ativo.
          const { data: m } = await supabase
            .from("clinic_members")
            .select("role")
            .eq("clinic_id", clinic.id)
            .eq("user_id", userId)
            .maybeSingle();
          if (m?.role === "clinic_admin") {
            const { count } = await supabase
              .from("clinic_members")
              .select("id", { count: "exact", head: true })
              .eq("clinic_id", clinic.id)
              .eq("active", true)
              .eq("role", "clinic_admin");
            if ((count ?? 0) <= 1) return result; // mantém acesso do membro
          }
        }
        await supabase
          .from("clinic_members")
          .update({ active } as never)
          .eq("clinic_id", clinic.id)
          .eq("user_id", userId);
      }
      return result;
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: keys.professionals.all });
      queryClient.invalidateQueries({ queryKey: keys.professionals.byId(id) });
      queryClient.invalidateQueries({ queryKey: ["clinic-members"] });
    },
  });
}
