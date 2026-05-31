import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { MONTH_NAMES_PT } from "@/features/monthlyEvolutions/api";
import type { MonthlyRow, GoalProgress } from "@/features/monthlyEvolutions/api";
import type { Tables } from "@/types/database";
import {
  getAddenda,
  getDigitalSignature,
  getParentFeedback,
  type DailyEvolution,
} from "@/features/dailyEvolutions/api";
import {
  specialtyLabels,
  attendanceTypeLabels,
  promptingLevelLabels,
  evolutionAssessmentLabels,
  guardianValidationMethodLabels,
} from "@/lib/labels";

const BRAND_DARK: [number, number, number] = [0, 31, 107];
const BRAND_ACCENT: [number, number, number] = [30, 136, 255];

export function exportMonthlyEvolutionPDF(
  monthly: MonthlyRow,
  clinicName: string,
) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;

  // Cabeçalho
  doc.setFillColor(...BRAND_DARK);
  doc.rect(0, 0, pageWidth, 60, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("TEAR", margin, 38);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Prontuário Inteligente para Clínicas de TEA", margin, 52);

  doc.setTextColor(255);
  doc.setFontSize(11);
  doc.text(clinicName, pageWidth - margin, 38, { align: "right" });
  doc.setFontSize(9);
  doc.text(
    `Emitido em ${new Date().toLocaleDateString("pt-BR")}`,
    pageWidth - margin,
    52,
    { align: "right" },
  );

  // Título
  doc.setTextColor(...BRAND_DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Evolução Mensal", margin, 100);

  const refMonth = MONTH_NAMES_PT[monthly.reference_month - 1];
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(60);
  doc.text(
    `${refMonth} / ${monthly.reference_year}`,
    margin,
    120,
  );

  // Identificação
  doc.setDrawColor(220);
  doc.line(margin, 134, pageWidth - margin, 134);

  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text(`Paciente:`, margin, 156);
  doc.text(`Profissional:`, margin, 174);
  doc.text(`Status:`, margin, 192);

  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.text(monthly.patient?.name ?? "—", margin + 80, 156);
  doc.text(monthly.professional?.name ?? "—", margin + 80, 174);
  doc.text(monthly.approved ? "Aprovada" : "Em revisão", margin + 80, 192);
  doc.setFont("helvetica", "normal");

  // Totais
  autoTable(doc, {
    startY: 210,
    head: [["Sessões totais", "Presenças", "Ausências"]],
    body: [
      [
        String(monthly.total_sessions),
        String(monthly.total_present),
        String(monthly.total_absent),
      ],
    ],
    theme: "grid",
    headStyles: { fillColor: BRAND_ACCENT, textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 10, halign: "center" },
    margin: { left: margin, right: margin },
  });

  // Síntese
  let y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
    .finalY + 24;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND_DARK);
  doc.text("Síntese gerada", margin, y);
  y += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(40);
  const summaryLines = doc.splitTextToSize(
    monthly.generated_summary,
    pageWidth - margin * 2,
  );
  doc.text(summaryLines, margin, y + 12);
  y += 12 + summaryLines.length * 12;

  if (monthly.professional_review) {
    y += 16;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...BRAND_DARK);
    doc.text("Análise profissional", margin, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(40);
    const reviewLines = doc.splitTextToSize(
      monthly.professional_review,
      pageWidth - margin * 2,
    );
    doc.text(reviewLines, margin, y + 14);
    y += 14 + reviewLines.length * 12;
  }

  // Metas
  const goals = Array.isArray(monthly.goals_progress)
    ? (monthly.goals_progress as unknown as GoalProgress[])
    : [];
  if (goals.length > 0) {
    y += 16;
    autoTable(doc, {
      startY: y,
      head: [["Meta", "Categoria", "Progresso", "Status"]],
      body: goals.map((g) => [
        g.description,
        g.category,
        `${g.current_progress}%`,
        g.status.replace(/_/g, " "),
      ]),
      theme: "striped",
      headStyles: { fillColor: BRAND_DARK, textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 9 },
      margin: { left: margin, right: margin },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY;
  }

  if (monthly.conclusion) {
    y += 24;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...BRAND_DARK);
    doc.text("Conclusão", margin, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(40);
    const lines = doc.splitTextToSize(
      monthly.conclusion,
      pageWidth - margin * 2,
    );
    doc.text(lines, margin, y + 14);
    y += 14 + lines.length * 12;
  }

  if (monthly.next_month_plan) {
    y += 16;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...BRAND_DARK);
    doc.text("Plano para o próximo mês", margin, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(40);
    const lines = doc.splitTextToSize(
      monthly.next_month_plan,
      pageWidth - margin * 2,
    );
    doc.text(lines, margin, y + 14);
  }

  // Assinatura do profissional responsável
  const ph = doc.internal.pageSize.getHeight();
  y += 48;
  if (y > ph - 90) {
    doc.addPage();
    y = 90;
  }
  const role = monthly.professional?.specialty
    ? specialtyLabels[monthly.professional.specialty]
    : "";
  const sigSource =
    monthly.approved && monthly.approved_at
      ? monthly.approved_at
      : monthly.created_at;
  const sigDate = new Date(sigSource).toLocaleDateString("pt-BR");
  doc.setDrawColor(120);
  doc.line(margin, y, margin + 240, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text(monthly.professional?.name ?? "—", margin, y + 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(90);
  if (role) doc.text(role, margin, y + 27);
  doc.text(
    `${monthly.approved ? "Aprovado e assinado" : "Emitido"} em ${sigDate}`,
    margin,
    y + (role ? 40 : 27),
  );

  // Rodapé
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setDrawColor(220);
  doc.line(margin, pageHeight - 40, pageWidth - margin, pageHeight - 40);
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(
    "Documento gerado pelo TEAR — Prontuário Inteligente para Clínicas de TEA.",
    margin,
    pageHeight - 24,
  );

  const file = `evolucao-mensal-${monthly.patient?.name?.replace(/\s+/g, "_") ?? "paciente"}-${monthly.reference_year}-${String(monthly.reference_month).padStart(2, "0")}.pdf`;
  doc.save(file);
}

function formatDateBR(iso: string): string {
  // datas "yyyy-mm-dd" sem timezone para evitar deslocamento de 1 dia.
  const [y, m, d] = iso.slice(0, 10).split("-");
  return d && m && y ? `${d}/${m}/${y}` : iso;
}

// Síntese da evolução diária em PDF A4 — cabeçalho institucional, identificação
// do paciente, conteúdo clínico, adendos e bloco de assinatura (digital
// ICP-Brasil quando houver). Otimizado para impressão.
export function exportDailyEvolutionPDF(
  evo: DailyEvolution,
  patient: Pick<Tables<"patients">, "name" | "cpf" | "birth_date"> | null,
  professional: Pick<
    Tables<"professionals">,
    "name" | "specialty" | "council_type" | "council_number" | "council_state"
  > | null,
  clinicName: string,
) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;

  // Cabeçalho institucional
  doc.setFillColor(...BRAND_DARK);
  doc.rect(0, 0, pageWidth, 60, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("TEAR", margin, 38);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Prontuário Inteligente para Clínicas de TEA", margin, 52);
  doc.setFontSize(11);
  doc.text(clinicName, pageWidth - margin, 38, { align: "right" });
  doc.setFontSize(9);
  doc.text(
    `Emitido em ${new Date().toLocaleString("pt-BR")}`,
    pageWidth - margin,
    52,
    { align: "right" },
  );

  // Título
  doc.setTextColor(...BRAND_DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Evolução Diária", margin, 96);

  // Identificação
  doc.setDrawColor(220);
  doc.line(margin, 108, pageWidth - margin, 108);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80);
  doc.text("Paciente:", margin, 128);
  doc.text("Profissional:", margin, 146);
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  const patientLine = [
    patient?.name ?? "—",
    patient?.cpf ? `CPF ${patient.cpf}` : null,
    patient?.birth_date ? `Nasc. ${formatDateBR(patient.birth_date)}` : null,
  ]
    .filter(Boolean)
    .join("  ·  ");
  const councilParts = [
    professional?.council_type,
    professional?.council_number,
    professional?.council_state,
  ].filter(Boolean);
  const profLine = [
    professional?.name ?? "—",
    professional?.specialty ? specialtyLabels[professional.specialty] : null,
    councilParts.length ? councilParts.join(" ") : null,
  ]
    .filter(Boolean)
    .join("  ·  ");
  doc.text(patientLine, margin + 90, 128);
  doc.text(profLine, margin + 90, 146);
  doc.setFont("helvetica", "normal");

  // Dados da sessão
  autoTable(doc, {
    startY: 162,
    head: [["Data", "Horário", "Duração", "Tipo", "Faturamento"]],
    body: [
      [
        formatDateBR(evo.session_date),
        `${evo.start_time.slice(0, 5)}–${evo.end_time.slice(0, 5)}`,
        `${evo.session_duration_minutes} min`,
        attendanceTypeLabels[evo.attendance_type],
        evo.is_private ? "Particular" : "Guia/operadora",
      ],
    ],
    theme: "grid",
    headStyles: { fillColor: BRAND_ACCENT, textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 9, halign: "center" },
    margin: { left: margin, right: margin },
  });

  let y =
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 22;

  function ensureSpace(needed: number) {
    if (y + needed > pageHeight - 60) {
      doc.addPage();
      y = 60;
    }
  }

  function section(title: string, body: string) {
    const text = body.trim() || "—";
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(text, contentWidth);
    ensureSpace(20 + lines.length * 12);
    doc.setTextColor(...BRAND_DARK);
    doc.text(title, margin, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(40);
    doc.text(lines, margin, y);
    y += lines.length * 12 + 10;
  }

  const skills = Array.isArray(evo.skills_worked)
    ? (evo.skills_worked as unknown[]).filter(
        (v): v is string => typeof v === "string",
      )
    : [];
  if (skills.length) section("Habilidades trabalhadas", skills.join(", "));
  section("Nível de suporte geral", promptingLevelLabels[evo.prompting_level]);
  if (evo.behavioral_notes)
    section("Comportamentos barreira observados", evo.behavioral_notes);
  if (evo.behavioral_intervention)
    section("Intervenções de manejo", evo.behavioral_intervention);
  section("Síntese / observações clínicas", evo.session_summary);
  section(
    "Avaliação de evolução",
    evolutionAssessmentLabels[evo.evolution_assessment],
  );
  section("Plano para a próxima sessão", evo.next_session_plan);
  if (evo.incidents) section("Intercorrências", evo.incidents);
  section(
    "Validação de presença do responsável",
    evo.guardian_presence_validation
      ? `Confirmada${
          evo.guardian_validation_method
            ? ` (${guardianValidationMethodLabels[evo.guardian_validation_method]})`
            : ""
        }`
      : "Não validada",
  );

  // Adendos / notas de retificação
  const addenda = getAddenda(evo);
  if (addenda.length) {
    addenda.forEach((a, i) => {
      const stamp = `${a.author_name ?? "—"} · ${new Date(a.created_at).toLocaleString("pt-BR")}`;
      section(`Adendo ${i + 1} — ${stamp}`, a.text);
    });
  }

  // Bloco de assinatura
  const sig = getDigitalSignature(evo);
  ensureSpace(110);
  y += 8;
  doc.setDrawColor(120);
  doc.line(margin, y, margin + 260, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text(sig?.signer_name ?? professional?.name ?? "—", margin, y + 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(90);
  let sy = y + 27;
  if (professional?.specialty) {
    doc.text(specialtyLabels[professional.specialty], margin, sy);
    sy += 13;
  }
  if (sig) {
    const rows = [
      "Assinado digitalmente — ICP-Brasil (A1)",
      sig.signer_cpf ? `CPF ${sig.signer_cpf}` : null,
      `Emissor: ${sig.certificate_issuer}`,
      `Certificado nº ${sig.certificate_serial}`,
      `Algoritmo: ${sig.algorithm}`,
      `Hash SHA-256: ${sig.content_hash}`,
      `Data/hora: ${new Date(sig.signed_at).toLocaleString("pt-BR")}`,
    ].filter(Boolean) as string[];
    rows.forEach((r) => {
      ensureSpace(13);
      doc.text(doc.splitTextToSize(r, contentWidth), margin, sy);
      sy += 12;
    });
  } else if (evo.professional_signature) {
    doc.text(
      `Assinatura eletrônica${evo.signed_at ? ` em ${new Date(evo.signed_at).toLocaleString("pt-BR")}` : ""}`,
      margin,
      sy,
    );
  } else {
    doc.text("Documento ainda não assinado.", margin, sy);
  }

  // Rodapé
  doc.setDrawColor(220);
  doc.line(margin, pageHeight - 40, pageWidth - margin, pageHeight - 40);
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(
    "Documento gerado pelo TEAR — Prontuário Inteligente para Clínicas de TEA.",
    margin,
    pageHeight - 24,
  );

  const file = `evolucao-diaria-${patient?.name?.replace(/\s+/g, "_") ?? "paciente"}-${evo.session_date}.pdf`;
  doc.save(file);
}

// Devolutiva para os Pais em PDF, em 2 vias (Clínica / Pais), com linguagem
// acessível e campo de assinatura física do responsável.
export function exportParentFeedbackPDF(
  evo: DailyEvolution,
  patient:
    | Pick<Tables<"patients">, "name" | "guardian_name" | "cpf">
    | null,
  professional: Pick<
    Tables<"professionals">,
    "name" | "specialty" | "council_type" | "council_number" | "council_state"
  > | null,
  clinicName: string,
) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  const fb = getParentFeedback(evo) ?? {
    previous_activities: "",
    next_activities: "",
    home_guidance: "",
  };
  const councilParts = [
    professional?.council_type,
    professional?.council_number,
    professional?.council_state,
  ].filter(Boolean);

  function renderVia(viaLabel: string) {
    doc.setFillColor(...BRAND_DARK);
    doc.rect(0, 0, pageWidth, 60, "F");
    doc.setTextColor(255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("TEAR", margin, 38);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Prontuário Inteligente para Clínicas de TEA", margin, 52);
    doc.setFontSize(11);
    doc.text(clinicName, pageWidth - margin, 34, { align: "right" });
    doc.setFontSize(9);
    doc.text(viaLabel, pageWidth - margin, 50, { align: "right" });

    doc.setTextColor(...BRAND_DARK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Devolutiva para os Pais", margin, 96);

    doc.setDrawColor(220);
    doc.line(margin, 108, pageWidth - margin, 108);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80);
    doc.text("Paciente:", margin, 128);
    doc.text("Responsável:", margin, 146);
    doc.text("Data / Profissional:", margin, 164);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text(patient?.name ?? "—", margin + 120, 128);
    doc.text(patient?.guardian_name ?? "—", margin + 120, 146);
    doc.text(
      [
        formatDateBR(evo.session_date),
        professional?.name ?? "—",
        councilParts.length ? councilParts.join(" ") : null,
      ]
        .filter(Boolean)
        .join("  ·  "),
      margin + 120,
      164,
    );
    doc.setFont("helvetica", "normal");

    let y = 192;
    function section(title: string, body: string) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...BRAND_DARK);
      doc.text(title, margin, y);
      y += 14;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(40);
      const lines = doc.splitTextToSize(body.trim() || "—", contentWidth);
      doc.text(lines, margin, y);
      y += lines.length * 12 + 14;
    }
    section("Atividades trabalhadas no plano anterior", fb.previous_activities);
    section("Atividades do próximo plano", fb.next_activities);
    section("Orientação para casa", fb.home_guidance);

    // Assinaturas
    const sy = pageHeight - 130;
    doc.setDrawColor(120);
    doc.line(margin, sy, margin + 230, sy);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(professional?.name ?? "—", margin, sy + 14);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(90);
    if (councilParts.length) doc.text(councilParts.join(" "), margin, sy + 27);
    doc.text("Profissional responsável", margin, sy + (councilParts.length ? 40 : 27));

    doc.setTextColor(0);
    doc.setFontSize(10);
    doc.text(
      "Ciente em: ____/____/______",
      margin,
      sy + 70,
    );
    doc.line(margin, sy + 96, margin + 280, sy + 96);
    doc.setFontSize(9);
    doc.setTextColor(90);
    doc.text("Assinatura do responsável", margin, sy + 110);

    doc.setDrawColor(220);
    doc.line(margin, pageHeight - 32, pageWidth - margin, pageHeight - 32);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(
      `${viaLabel} — Documento gerado pelo TEAR.`,
      margin,
      pageHeight - 18,
    );
  }

  renderVia("Via da Clínica");
  doc.addPage();
  renderVia("Via dos Pais");

  const file = `devolutiva-${patient?.name?.replace(/\s+/g, "_") ?? "paciente"}-${evo.session_date}.pdf`;
  doc.save(file);
}
