import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  formatMonthlyPeriod,
  monthlyFileSuffix,
  getMonthlyDigitalSignature,
} from "@/features/monthlyEvolutions/api";
import { formatDateBR } from "@/lib/date";
import type {
  MonthlyRow,
  GoalProgress,
  FrequencyReportData,
} from "@/features/monthlyEvolutions/api";
import type { Tables } from "@/types/database";
import {
  getAddenda,
  getDigitalSignature,
  getParentFeedback,
  getStructuredData,
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

// Rubrica digitalizada do profissional (data URL vindo do Storage privado).
const SIGNATURE_MAX_W = 170;
const SIGNATURE_MAX_H = 46;

// Desenha a rubrica acima da linha de assinatura preservando a proporção e
// devolve o y da linha. Imagem inválida nunca impede a emissão do documento.
function drawSignatureImage(
  doc: jsPDF,
  dataUrl: string,
  x: number,
  topY: number,
): number {
  try {
    const props = doc.getImageProperties(dataUrl);
    const ratio = props.height / props.width;
    if (!Number.isFinite(ratio) || ratio <= 0) return topY;
    let w = SIGNATURE_MAX_W;
    let h = w * ratio;
    if (h > SIGNATURE_MAX_H) {
      h = SIGNATURE_MAX_H;
      w = h / ratio;
    }
    doc.addImage(dataUrl, props.fileType === "PNG" ? "PNG" : "JPEG", x, topY, w, h);
    return topY + h + 4;
  } catch {
    return topY;
  }
}

export function exportMonthlyEvolutionPDF(
  monthly: MonthlyRow,
  clinicName: string,
  // Rubrica do profissional responsável; aplicada apenas quando a evolução já
  // está assinada/aprovada — documento em aberto nunca sai assinado.
  signatureImage?: string | null,
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
  doc.text(
    monthly.period_type === "periodo"
      ? "Evolução por Período"
      : "Evolução Mensal",
    margin,
    100,
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(60);
  doc.text(formatMonthlyPeriod(monthly), margin, 120);

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
    doc.text("Plano para o próximo período", margin, y);
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
  const rubric =
    monthly.signed_at || monthly.approved ? (signatureImage ?? null) : null;
  y += 48;
  if (y > ph - (rubric ? 150 : 90)) {
    doc.addPage();
    y = 90;
  }
  if (rubric) y = drawSignatureImage(doc, rubric, margin, y);
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
  let sy = y + 14;
  if (role) {
    sy += 13;
    doc.text(role, margin, sy);
  }
  sy += 13;
  doc.text(`Emitido em ${sigDate}`, margin, sy);

  if (monthly.reviewer_name) {
    sy += 13;
    doc.text(`Aprovado pelo coordenador ${monthly.reviewer_name}`, margin, sy);
  }

  const monthlySig = getMonthlyDigitalSignature(monthly);
  if (monthlySig) {
    const rows = [
      "Assinado digitalmente — ICP-Brasil (A1)",
      `Titular: ${monthlySig.signer_name}${monthlySig.signer_cpf ? ` · CPF ${monthlySig.signer_cpf}` : ""}`,
      `Emissor: ${monthlySig.certificate_issuer}`,
      `Hash SHA-256: ${monthlySig.content_hash}`,
      `Data/hora: ${new Date(monthlySig.signed_at).toLocaleString("pt-BR")}`,
    ];
    rows.forEach((r) => {
      sy += 12;
      doc.text(doc.splitTextToSize(r, pageWidth - margin * 2), margin, sy);
    });
  }

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

  const safePatient = monthly.patient?.name?.replace(/\s+/g, "_") ?? "paciente";
  const prefix = monthlySig ? "evolucao-assinada" : "evolucao";
  doc.save(`${prefix}-${safePatient}-${monthlyFileSuffix(monthly)}.pdf`);
}

function ageFromBirthBR(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return "—";
  const now = new Date();
  let age = now.getFullYear() - y;
  const mo = now.getMonth() + 1;
  const da = now.getDate();
  if (mo < m || (mo === m && da < d)) age -= 1;
  return age >= 0 ? `${age} anos` : "—";
}

// Histórico de Frequência de Atendimento — modelo no padrão exigido pelas
// operadoras (ex.: Unimed): identificação do beneficiário/profissional e tabela
// de datas/horários com colunas de assinatura em branco para assinatura física
// "conforme RG". Sem a logo da operadora — usa a identidade TEAR.
export function exportFrequencyHistoryPDF(
  data: FrequencyReportData,
  clinicName: string,
): void {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;

  // Cabeçalho institucional TEAR
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
    `Emitido em ${new Date().toLocaleDateString("pt-BR")}`,
    pageWidth - margin,
    52,
    { align: "right" },
  );

  // Título
  doc.setTextColor(...BRAND_DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("Histórico de Frequência de Atendimento", margin, 96);

  const { patient, professional } = data;
  const council = professional
    ? [professional.council_type, professional.council_number, professional.council_state]
        .filter(Boolean)
        .join(" ")
    : "";
  const specialty = professional?.specialty
    ? specialtyLabels[professional.specialty]
    : "";
  const refPeriod = data.periodLabel;

  // Campo com rótulo (cinza, pequeno) e valor (preto, seminegrito) abaixo.
  function field(label: string, value: string, x: number, y: number, w: number) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(120);
    doc.text(label.toUpperCase(), x, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(20);
    const lines = doc.splitTextToSize(value || "—", w);
    doc.text(lines[0] ?? "—", x, y + 12);
    doc.setDrawColor(225);
    doc.line(x, y + 16, x + w - 8, y + 16);
  }

  let y = 118;
  const colW = contentWidth / 4;
  // Linha 1: beneficiário, carteirinha, período, idade
  // (o período tem folga extra por comportar um intervalo "de → até").
  field("Beneficiário", patient?.name ?? "—", margin, y, colW * 1.4);
  field(
    "Código Carteira Beneficiário",
    patient?.health_plan_card ?? "—",
    margin + colW * 1.4,
    y,
    colW * 1.0,
  );
  field("Período de Referência", refPeriod, margin + colW * 2.4, y, colW * 1.1);
  field("Idade", ageFromBirthBR(patient?.birth_date), margin + colW * 3.5, y, colW * 0.5);

  y += 34;
  // Linha 2: profissional, especialidade, conselho
  field("Nome do Profissional", professional?.name ?? "—", margin, y, colW * 1.7);
  field("Especialidade", specialty || "—", margin + colW * 1.7, y, colW * 1.2);
  field("Nº Registro Conselho", council || "—", margin + colW * 2.9, y, colW * 1.1);

  y += 34;
  // Linha 3: operadora, acompanhante
  field(
    "Convênio / Operadora",
    patient?.health_plan_name ?? "—",
    margin,
    y,
    colW * 1.7,
  );
  field(
    "Nome do Acompanhante",
    patient?.guardian_name ?? "—",
    margin + colW * 1.7,
    y,
    colW * 1.5,
  );
  field("Grau de Parentesco", "", margin + colW * 3.2, y, colW * 0.8);

  y += 30;

  // Tabela de frequência
  const body = data.rows.map((r) => [
    formatDateBR(r.session_date),
    r.start_time?.slice(0, 5) ?? "",
    r.end_time?.slice(0, 5) ?? "",
    "1",
    "",
    "",
  ]);
  // Quando não há evolução no período, imprime linhas em branco para
  // preenchimento manual (o formulário continua utilizável impresso).
  if (body.length === 0) {
    for (let i = 0; i < 6; i += 1) body.push(["", "", "", "", "", ""]);
  }

  autoTable(doc, {
    startY: y,
    head: [
      [
        "Data",
        "Horário de Início",
        "Horário de Término",
        "Qtd. Sessões",
        "Assinatura do(a) Profissional",
        "Assinatura do(a) Acompanhante",
      ],
    ],
    body,
    foot:
      data.rows.length > 0
        ? [["Total de sessões no período", "", "", String(data.rows.length), "", ""]]
        : undefined,
    theme: "grid",
    headStyles: {
      fillColor: BRAND_DARK,
      textColor: 255,
      fontStyle: "bold",
      fontSize: 8,
      halign: "center",
      valign: "middle",
    },
    footStyles: {
      fillColor: [240, 244, 252],
      textColor: BRAND_DARK,
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: { minCellHeight: 22, valign: "middle" },
    styles: { fontSize: 9, halign: "center", cellPadding: 4 },
    columnStyles: {
      0: { cellWidth: 62 },
      1: { cellWidth: 70 },
      2: { cellWidth: 70 },
      3: { cellWidth: 55 },
      4: { cellWidth: "auto" },
      5: { cellWidth: "auto" },
    },
    margin: { left: margin, right: margin },
  });

  let cursorY = (doc as unknown as { lastAutoTable: { finalY: number } })
    .lastAutoTable.finalY;

  // Declaração legal + blocos de assinatura física — precisam de ~150pt.
  const needed = 150;
  if (cursorY + needed > pageHeight - 40) {
    doc.addPage();
    cursorY = 80;
  }

  cursorY += 24;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(60);
  const declaration = doc.splitTextToSize(
    "Em conformidade com o artigo 299 do Código Penal, declaramos que as informações prestadas neste documento estão corretas, e que as terapias ocorreram para o beneficiário indicado, nas datas, locais e horários registrados.",
    contentWidth,
  );
  doc.text(declaration, margin, cursorY);
  cursorY += declaration.length * 12 + 40;

  // Duas assinaturas lado a lado
  const half = contentWidth / 2;
  const gap = 24;
  doc.setDrawColor(120);
  doc.line(margin, cursorY, margin + half - gap, cursorY);
  doc.line(margin + half, cursorY, pageWidth - margin, cursorY);
  doc.setFontSize(8);
  doc.setTextColor(90);
  doc.text(
    "Local, data, carimbo e assinatura do profissional responsável (conforme RG)",
    margin,
    cursorY + 12,
  );
  doc.text(
    "Local, data e assinatura do acompanhante (igual ao RG)",
    margin + half,
    cursorY + 12,
  );

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

  const safeName = patient?.name?.replace(/\s+/g, "_") ?? "paciente";
  doc.save(`frequencia-${safeName}-${data.periodFileSuffix}.pdf`);
}

// Síntese da evolução diária em PDF A4 — cabeçalho institucional, identificação
// do paciente, conteúdo clínico, adendos e bloco de assinatura (digital
// ICP-Brasil quando houver). Otimizado para impressão.
function buildDailyEvolutionPDF(
  evo: DailyEvolution,
  patient: Pick<Tables<"patients">, "name" | "cpf" | "birth_date"> | null,
  professional: Pick<
    Tables<"professionals">,
    "name" | "specialty" | "council_type" | "council_number" | "council_state"
  > | null,
  clinicName: string,
  // Rubrica digitalizada do profissional; só é aplicada quando a evolução já
  // está assinada (ver bloco de assinatura).
  signatureImage?: string | null,
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

  // Dados estruturados do Aplicador ABA / AT (programas e níveis de ajuda).
  const structured = getStructuredData(evo);
  if (structured?.kind === "aba_at") {
    if (structured.target_behaviors)
      section("Comportamentos-alvo e barreiras", structured.target_behaviors);
    if (structured.programs.length) {
      ensureSpace(40 + structured.programs.length * 16);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...BRAND_DARK);
      doc.text("Programas de ensino aplicados", margin, y);
      y += 8;
      autoTable(doc, {
        startY: y,
        head: [["Programa / Target", "Tentativas"]],
        body: structured.programs.map((p) => [
          p.program,
          p.trials != null ? String(p.trials) : "—",
        ]),
        theme: "grid",
        headStyles: { fillColor: BRAND_ACCENT, textColor: 255, fontStyle: "bold" },
        styles: { fontSize: 9 },
        margin: { left: margin, right: margin },
      });
      y =
        (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
          .finalY + 16;
    }
    const pm = structured.prompting;
    const pmParts = [
      pm.physical != null ? `Física ${pm.physical}%` : null,
      pm.gestural != null ? `Gestual ${pm.gestural}%` : null,
      pm.verbal != null ? `Verbal ${pm.verbal}%` : null,
      pm.independent != null ? `Independente ${pm.independent}%` : null,
    ].filter(Boolean);
    if (pmParts.length)
      section("Nível de ajuda predominante", pmParts.join("   ·   "));
    if (structured.session_analysis)
      section("Análise da sessão e conduta", structured.session_analysis);
  }

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
  // A rubrica entra apenas em evolução assinada pelo profissional — rascunho
  // ou evolução em aberto nunca é emitida com a assinatura aplicada.
  const rubric = evo.professional_signature ? (signatureImage ?? null) : null;
  ensureSpace(rubric ? 170 : 110);
  y += 8;
  if (rubric) y = drawSignatureImage(doc, rubric, margin, y);
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

  // Bloco de homologação do supervisor (evoluções de Aplicador ABA / AT).
  const supSig = getDigitalSignature({ digital_signature: evo.supervisor_signature });
  if (supSig || evo.validation_status) {
    ensureSpace(110);
    sy += 16;
    doc.setDrawColor(120);
    doc.line(margin, sy, margin + 260, sy);
    sy += 14;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(
      `Homologação do supervisor: ${supSig?.signer_name ?? "—"}`,
      margin,
      sy,
    );
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(90);
    sy += 13;
    if (supSig) {
      const rows = [
        "Homologado e assinado digitalmente — ICP-Brasil (A1)",
        supSig.signer_cpf ? `CPF ${supSig.signer_cpf}` : null,
        `Emissor: ${supSig.certificate_issuer}`,
        `Hash SHA-256: ${supSig.content_hash}`,
        `Data/hora: ${new Date(supSig.signed_at).toLocaleString("pt-BR")}`,
      ].filter(Boolean) as string[];
      rows.forEach((r) => {
        ensureSpace(13);
        doc.text(doc.splitTextToSize(r, contentWidth), margin, sy);
        sy += 12;
      });
    } else {
      doc.text("Pendente de validação técnica.", margin, sy);
    }
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
  return { doc, file };
}

type DailyEvolutionPDFArgs = Parameters<typeof buildDailyEvolutionPDF>;

export function exportDailyEvolutionPDF(...args: DailyEvolutionPDFArgs) {
  const { doc, file } = buildDailyEvolutionPDF(...args);
  doc.save(file);
}

// Mesmo PDF, como data URI base64 — formato aceito pela API da ClickSign
// (content_base64 do documento do envelope).
export function renderDailyEvolutionPDFBase64(...args: DailyEvolutionPDFArgs): {
  filename: string;
  contentBase64: string;
} {
  const { doc, file } = buildDailyEvolutionPDF(...args);
  const bytes = new Uint8Array(doc.output("arraybuffer"));
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return {
    filename: file,
    contentBase64: `data:application/pdf;base64,${btoa(binary)}`,
  };
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

export type MedicalDocKind = "receita" | "atestado" | "laudo";

const MEDICAL_DOC_TITLES: Record<MedicalDocKind, string> = {
  receita: "Receituário / Prescrição",
  atestado: "Atestado Médico",
  laudo: "Laudo Médico",
};

// Documentos médicos emitidos a partir da evolução (correção #12): receita,
// atestado e laudo, em folha timbrada da clínica e com bloco de assinatura.
export function exportMedicalDocumentPDF(
  kind: MedicalDocKind,
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
  doc.text(`Emitido em ${new Date().toLocaleString("pt-BR")}`, pageWidth - margin, 52, {
    align: "right",
  });

  // Título
  doc.setTextColor(...BRAND_DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(MEDICAL_DOC_TITLES[kind], margin, 96);

  // Identificação
  doc.setDrawColor(220);
  doc.line(margin, 108, pageWidth - margin, 108);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80);
  doc.text("Paciente:", margin, 128);
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  const patientLine = [
    patient?.name ?? "—",
    patient?.cpf ? `CPF ${patient.cpf}` : null,
    patient?.birth_date ? `Nasc. ${formatDateBR(patient.birth_date)}` : null,
  ]
    .filter(Boolean)
    .join("  ·  ");
  doc.text(patientLine, margin + 64, 128);
  doc.setFont("helvetica", "normal");

  // Corpo do documento conforme o tipo.
  const med = getStructuredData(evo);
  const medical = med?.kind === "medical" ? med : null;
  let body = "";
  if (kind === "receita") {
    body =
      medical?.therapeutic_conduct?.trim() ||
      evo.next_session_plan ||
      "Conforme conduta terapêutica registrada na evolução.";
  } else if (kind === "atestado") {
    body =
      `Atesto, para os devidos fins, que o(a) paciente acima esteve em ` +
      `atendimento nesta clínica no dia ${formatDateBR(evo.session_date)}, ` +
      `no horário de ${evo.start_time.slice(0, 5)} às ${evo.end_time.slice(0, 5)}.`;
  } else {
    const cidParts = [
      medical?.cid11 ? `CID-11: ${medical.cid11}` : null,
      medical?.cid10 ? `CID-10: ${medical.cid10}` : null,
    ]
      .filter(Boolean)
      .join("   ");
    body = [
      medical?.anamnesis?.trim() || evo.session_summary,
      medical?.clinical_exam?.trim() ? `\nExame: ${medical.clinical_exam.trim()}` : "",
      cidParts ? `\n${cidParts}` : "",
      medical?.therapeutic_conduct?.trim()
        ? `\nConduta: ${medical.therapeutic_conduct.trim()}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  doc.setFontSize(11);
  doc.setTextColor(20);
  const lines = doc.splitTextToSize(body, contentWidth);
  doc.text(lines, margin, 168);

  // Bloco de assinatura física do profissional.
  const councilParts = [
    professional?.council_type,
    professional?.council_number,
    professional?.council_state,
  ].filter(Boolean);
  const sigY = pageHeight - 120;
  doc.setDrawColor(120);
  doc.line(margin, sigY, margin + 280, sigY);
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.text(professional?.name ?? "—", margin, sigY + 16);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(90);
  doc.setFontSize(9);
  const profMeta = [
    professional?.specialty ? specialtyLabels[professional.specialty] : null,
    councilParts.length ? councilParts.join(" ") : null,
  ]
    .filter(Boolean)
    .join("  ·  ");
  if (profMeta) doc.text(profMeta, margin, sigY + 30);

  doc.setDrawColor(220);
  doc.line(margin, pageHeight - 32, pageWidth - margin, pageHeight - 32);
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(
    `${MEDICAL_DOC_TITLES[kind]} — Documento gerado pelo TEAR.`,
    margin,
    pageHeight - 18,
  );

  const file = `${kind}-${patient?.name?.replace(/\s+/g, "_") ?? "paciente"}-${evo.session_date}.pdf`;
  doc.save(file);
}
