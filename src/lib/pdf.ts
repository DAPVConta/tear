import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { MONTH_NAMES_PT } from "@/features/monthlyEvolutions/api";
import type { MonthlyRow, GoalProgress } from "@/features/monthlyEvolutions/api";

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
