import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { callRpc } from "@/lib/typedRpc";
import { keys } from "@/lib/queryKeys";
import { useAuth } from "@/providers/AuthProvider";

export type DeletionRequest = {
  id: number;
  user_id: string;
  user_email: string;
  reason: string | null;
  status: "pending" | "processed" | "denied";
  requested_at: string;
  processed_at: string | null;
};

export function useExportMyData() {
  return useMutation({
    mutationFn: () => callRpc<unknown>("export_my_data"),
  });
}

export function useMyDeletionRequest() {
  const { user } = useAuth();
  return useQuery({
    queryKey: keys.lgpd.myDeletionRequest(user?.id),
    enabled: !!user,
    queryFn: async (): Promise<DeletionRequest | null> => {
      // data_deletion_requests ainda não está nos tipos gerados —
      // single ponto de cast aqui ao invocar o builder.
      const builder = supabase.from(
        "data_deletion_requests" as never,
      ) as unknown as {
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
      const { data, error } = await builder
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
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reason: string | undefined) =>
      callRpc<DeletionRequest>("request_my_data_deletion", {
        p_reason: reason ?? null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: keys.lgpd.myDeletionRequest(user?.id),
      });
    },
  });
}
