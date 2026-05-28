import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";

export function useExportMyData() {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("export_my_data" as never);
      if (error) throw error;
      return data as unknown;
    },
  });
}

export type DeletionRequest = {
  id: number;
  user_id: string;
  user_email: string;
  reason: string | null;
  status: "pending" | "processed" | "denied";
  requested_at: string;
  processed_at: string | null;
};

export function useMyDeletionRequest() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-deletion-request", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<DeletionRequest | null> => {
      // Tabela ainda não está nos tipos gerados — query via fluent API
      // com casts; quando regenerarmos os tipos isso some.
      const { data, error } = await (
        supabase as unknown as {
          from: (t: string) => {
            select: (s: string) => {
              eq: (
                k: string,
                v: string,
              ) => {
                order: (
                  k: string,
                  opts: { ascending: boolean },
                ) => {
                  limit: (n: number) => {
                    maybeSingle: () => Promise<{
                      data: DeletionRequest | null;
                      error: Error | null;
                    }>;
                  };
                };
              };
            };
          };
        }
      )
        .from("data_deletion_requests")
        .select("*")
        .eq("user_id", user!.id)
        .order("requested_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useRequestDataDeletion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reason: string | undefined) => {
      const { error } = await supabase.rpc(
        "request_my_data_deletion" as never,
        { p_reason: reason ?? null } as never,
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-deletion-request"] });
    },
  });
}
