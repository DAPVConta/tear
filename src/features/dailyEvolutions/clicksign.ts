import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { keys } from "@/lib/queryKeys";
import { useClinic } from "@/providers/ClinicProvider";
import { invokeEdge } from "@/features/ai/api";
import { renderDailyEvolutionPDFBase64 } from "@/lib/pdf";
import { fetchSignatureDataUrl } from "@/features/professionals/api";
import type { DailyEvolution } from "@/features/dailyEvolutions/api";

// Assinatura digital via ClickSign (API v3 — Envelopes). O front gera o PDF
// da evolução e envia à Edge Function clicksign-signature, que cria o
// envelope e dispara o link de assinatura por e-mail. O token da API vive
// apenas nos Secrets do servidor.

export type ClickSignEnvelope = {
  envelope_id: string;
  document_id: string;
  signer_id: string;
  signer_name: string;
  signer_email: string;
  status: "pending" | "signed";
  requested_at: string;
  finished_at: string | null;
};

export function getClickSignEnvelope(
  e: Pick<DailyEvolution, "clicksign"> | null | undefined,
): ClickSignEnvelope | null {
  const s = e?.clicksign;
  return s && typeof s === "object" && !Array.isArray(s)
    ? (s as unknown as ClickSignEnvelope)
    : null;
}

export type ClickSignRequestInput = {
  evolution: DailyEvolution;
  signerName: string;
  signerEmail: string;
  signerCpf?: string;
};

// Gera o relatório da evolução (PDF) e abre a solicitação de assinatura na
// ClickSign. Paciente e profissional são buscados aqui (RLS por clínica) para
// montar o PDF completo a partir de qualquer linha da listagem.
export function useRequestClickSignSignature() {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();

  return useMutation({
    mutationFn: async ({
      evolution,
      signerName,
      signerEmail,
      signerCpf,
    }: ClickSignRequestInput) => {
      if (!clinic?.id) throw new Error("Clínica não definida");

      const [{ data: patient }, { data: professional }] = await Promise.all([
        supabase
          .from("patients")
          .select("name, cpf, birth_date")
          .eq("id", evolution.patient_id)
          .eq("clinic_id", clinic.id)
          .maybeSingle(),
        supabase
          .from("professionals")
          .select(
            "name, specialty, council_type, council_number, council_state, signature_path",
          )
          .eq("id", evolution.professional_id)
          .eq("clinic_id", clinic.id)
          .maybeSingle(),
      ]);

      // Rubrica digitalizada: só faz sentido (e só é aplicada) se a evolução
      // já estiver assinada pelo profissional. Falha ao baixar não bloqueia o
      // envio para assinatura.
      let signatureImage: string | null = null;
      if (evolution.professional_signature && professional?.signature_path) {
        signatureImage = await fetchSignatureDataUrl(
          professional.signature_path,
        ).catch(() => null);
      }

      // Mesma regra para o supervisor: a rubrica dele só entra no documento se
      // a homologação técnica já tiver sido registrada.
      let supervisorSignatureImage: string | null = null;
      if (evolution.supervisor_signature && evolution.supervisor_id) {
        const { data: supervisor } = await supabase
          .from("professionals")
          .select("signature_path")
          .eq("id", evolution.supervisor_id)
          .eq("clinic_id", clinic.id)
          .maybeSingle();
        if (supervisor?.signature_path) {
          supervisorSignatureImage = await fetchSignatureDataUrl(
            supervisor.signature_path,
          ).catch(() => null);
        }
      }

      const { filename, contentBase64 } = renderDailyEvolutionPDFBase64(
        evolution,
        patient ?? null,
        professional ?? null,
        clinic.trade_name || clinic.name || "Clínica",
        signatureImage,
        supervisorSignatureImage,
      );

      const data = await invokeEdge<{ clicksign?: ClickSignEnvelope }>(
        "clicksign-signature",
        {
          action: "request",
          evolutionId: evolution.id,
          clinicId: clinic.id,
          filename,
          contentBase64,
          signer: {
            name: signerName,
            email: signerEmail,
            documentation: signerCpf || undefined,
          },
        },
      );
      if (!data?.clicksign) throw new Error("Resposta vazia da ClickSign.");
      return data.clicksign;
    },
    onSuccess: (_data, { evolution }) => {
      queryClient.invalidateQueries({ queryKey: keys.evolutions.all });
      queryClient.invalidateQueries({ queryKey: keys.evolutions.byId(evolution.id) });
    },
  });
}

// Consulta o envelope na ClickSign; quando finalizado, a Edge Function marca a
// evolução como assinada (professional_signature + signed_at).
export function useRefreshClickSignStatus() {
  const queryClient = useQueryClient();
  const { clinic } = useClinic();

  return useMutation({
    mutationFn: async (evolutionId: number) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      const data = await invokeEdge<{
        clicksign?: ClickSignEnvelope;
        envelope_status?: string;
      }>("clicksign-signature", {
        action: "status",
        evolutionId,
        clinicId: clinic.id,
      });
      if (!data?.clicksign) throw new Error("Resposta vazia da ClickSign.");
      return { ...data.clicksign, envelope_status: data.envelope_status };
    },
    onSuccess: (_data, evolutionId) => {
      queryClient.invalidateQueries({ queryKey: keys.evolutions.all });
      queryClient.invalidateQueries({ queryKey: keys.evolutions.byId(evolutionId) });
    },
  });
}

// Obtém a URL do documento assinado (PDF com página de assinaturas) na
// ClickSign para download. Disponível após o envelope ser finalizado.
export function useGetSignedDocumentUrl() {
  const { clinic } = useClinic();
  return useMutation({
    mutationFn: async (evolutionId: number) => {
      if (!clinic?.id) throw new Error("Clínica não definida");
      const data = await invokeEdge<{ url?: string }>("clicksign-signature", {
        action: "download",
        evolutionId,
        clinicId: clinic.id,
      });
      if (!data?.url) throw new Error("Documento assinado ainda não disponível.");
      return data.url;
    },
  });
}
