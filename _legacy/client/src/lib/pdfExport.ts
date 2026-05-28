import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface PdfHeader {
  clinicName?: string;
  title: string;
  subtitle?: string;
}

function addHeader(doc: jsPDF, header: PdfHeader, yPos: number): number {
  // Logo area / clinic name
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 128, 128); // teal
  doc.text("PEET", 14, yPos);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text("Prontuário Eletrônico de Evolução Terapêutica", 14, yPos + 5);

  if (header.clinicName) {
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(header.clinicName, 196, yPos, { align: "right" });
  }

  yPos += 12;
  // Divider line
  doc.setDrawColor(0, 128, 128);
  doc.setLineWidth(0.5);
  doc.line(14, yPos, 196, yPos);
  yPos += 8;

  // Title
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text(header.title, 105, yPos, { align: "center" });
  yPos += 6;

  if (header.subtitle) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(header.subtitle, 105, yPos, { align: "center" });
    yPos += 6;
  }

  yPos += 4;
  return yPos;
}

function addFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Gerado pelo PEET em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`,
      14,
      287
    );
    doc.text(`Página ${i} de ${pageCount}`, 196, 287, { align: "right" });
  }
}

function addMarkdownContent(doc: jsPDF, text: string, startY: number): number {
  let y = startY;
  const pageHeight = 280;
  const lineHeight = 5;
  const maxWidth = 175;

  const lines = text.split("\n");
  for (const line of lines) {
    if (y > pageHeight) {
      doc.addPage();
      y = 20;
    }

    const trimmed = line.trim();

    // Headers
    if (trimmed.startsWith("### ")) {
      y += 3;
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 100, 100);
      doc.text(trimmed.replace("### ", ""), 14, y);
      y += lineHeight + 2;
    } else if (trimmed.startsWith("## ")) {
      y += 4;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 80, 80);
      doc.text(trimmed.replace("## ", ""), 14, y);
      y += lineHeight + 3;
    } else if (trimmed.startsWith("# ")) {
      y += 5;
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text(trimmed.replace("# ", ""), 14, y);
      y += lineHeight + 4;
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(50, 50, 50);
      const bulletText = trimmed.replace(/^[-*]\s/, "");
      const splitLines = doc.splitTextToSize(`• ${cleanMarkdown(bulletText)}`, maxWidth - 6);
      for (const sl of splitLines) {
        if (y > pageHeight) { doc.addPage(); y = 20; }
        doc.text(sl, 20, y);
        y += lineHeight;
      }
    } else if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(40, 40, 40);
      doc.text(trimmed.replace(/\*\*/g, ""), 14, y);
      y += lineHeight + 1;
    } else if (trimmed === "") {
      y += 3;
    } else {
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(50, 50, 50);
      const splitLines = doc.splitTextToSize(cleanMarkdown(trimmed), maxWidth);
      for (const sl of splitLines) {
        if (y > pageHeight) { doc.addPage(); y = 20; }
        doc.text(sl, 14, y);
        y += lineHeight;
      }
    }
  }

  return y;
}

function cleanMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`(.*?)`/g, "$1");
}

// ==================== EXPORTAR EVOLUÇÃO MENSAL ====================
export function exportMonthlyEvolutionPDF(data: {
  patientName: string;
  professionalName: string;
  month: number;
  year: number;
  totalSessions: number;
  totalPresent: number;
  totalAbsent: number;
  summary: string;
  review?: string;
  approved: boolean;
  clinicName?: string;
}) {
  const doc = new jsPDF();
  const monthName = new Date(data.year, data.month - 1).toLocaleString("pt-BR", { month: "long" });

  let y = addHeader(doc, {
    clinicName: data.clinicName,
    title: "Relatório de Evolução Mensal",
    subtitle: `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} de ${data.year}`,
  }, 15);

  // Info box
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(14, y, 182, 28, 2, 2, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(60, 60, 60);
  doc.text("Paciente:", 18, y + 7);
  doc.text("Profissional:", 18, y + 14);
  doc.text("Sessões:", 18, y + 21);

  doc.setFont("helvetica", "normal");
  doc.text(data.patientName, 50, y + 7);
  doc.text(data.professionalName, 50, y + 14);
  doc.text(`${data.totalSessions} total | ${data.totalPresent} presenças | ${data.totalAbsent} faltas`, 50, y + 21);

  // Status badge
  doc.setFontSize(8);
  if (data.approved) {
    doc.setFillColor(34, 197, 94);
    doc.roundedRect(160, y + 4, 32, 8, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.text("APROVADO", 176, y + 9.5, { align: "center" });
  } else {
    doc.setFillColor(250, 204, 21);
    doc.roundedRect(160, y + 4, 32, 8, 2, 2, "F");
    doc.setTextColor(60, 60, 60);
    doc.text("PENDENTE", 176, y + 9.5, { align: "center" });
  }

  y += 36;

  // Summary content
  y = addMarkdownContent(doc, data.summary, y);

  // Professional review
  if (data.review) {
    y += 6;
    if (y > 260) { doc.addPage(); y = 20; }
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 100, 100);
    doc.text("Revisão do Profissional", 14, y);
    y += 6;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 50);
    const reviewLines = doc.splitTextToSize(data.review, 175);
    for (const line of reviewLines) {
      if (y > 280) { doc.addPage(); y = 20; }
      doc.text(line, 14, y);
      y += 5;
    }
  }

  addFooter(doc);
  doc.save(`evolucao-mensal-${data.patientName.replace(/\s+/g, "-").toLowerCase()}-${data.month}-${data.year}.pdf`);
}

// ==================== EXPORTAR CHECKLIST DE AUDITORIA ====================
export function exportAuditPDF(data: {
  month: number;
  year: number;
  summary: {
    totalIssues: number;
    critical: number;
    high: number;
    medium: number;
    billingReady: boolean;
  };
  billingChecks: Array<{ item: string; status: boolean; detail: string }>;
  issues: Array<{ severity: string; type: string; message: string; date?: string }>;
  clinicName?: string;
}) {
  const doc = new jsPDF();
  const monthName = new Date(data.year, data.month - 1).toLocaleString("pt-BR", { month: "long" });

  let y = addHeader(doc, {
    clinicName: data.clinicName,
    title: "Relatório de Auditoria e Faturamento",
    subtitle: `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} de ${data.year}`,
  }, 15);

  // Summary box
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(14, y, 182, 20, 2, 2, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(60, 60, 60);

  const cols = [
    { label: "Total Pendências", value: String(data.summary.totalIssues), color: [30, 30, 30] },
    { label: "Críticas", value: String(data.summary.critical), color: [220, 38, 38] },
    { label: "Alta", value: String(data.summary.high), color: [234, 88, 12] },
    { label: "Média", value: String(data.summary.medium), color: [217, 119, 6] },
  ];

  cols.forEach((col, i) => {
    const x = 20 + i * 45;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(col.color[0], col.color[1], col.color[2]);
    doc.text(col.value, x, y + 10);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(col.label, x, y + 15);
  });

  // Billing ready badge
  if (data.summary.billingReady) {
    doc.setFillColor(34, 197, 94);
    doc.roundedRect(155, y + 4, 36, 12, 2, 2, "F");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("PRONTO FATURAR", 173, y + 12, { align: "center" });
  } else {
    doc.setFillColor(239, 68, 68);
    doc.roundedRect(155, y + 4, 36, 12, 2, 2, "F");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("PENDÊNCIAS", 173, y + 12, { align: "center" });
  }

  y += 28;

  // Billing Checklist
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 100, 100);
  doc.text("Checklist de Faturamento", 14, y);
  y += 6;

  if (data.billingChecks.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [["Status", "Item", "Detalhe"]],
      body: data.billingChecks.map((check) => [
        check.status ? "OK" : "PENDENTE",
        check.item,
        check.detail,
      ]),
      headStyles: { fillColor: [0, 128, 128], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 22, halign: "center" },
        1: { cellWidth: 100 },
        2: { cellWidth: 55 },
      },
      didParseCell: (hookData: any) => {
        if (hookData.section === "body" && hookData.column.index === 0) {
          if (hookData.cell.raw === "OK") {
            hookData.cell.styles.textColor = [34, 197, 94];
            hookData.cell.styles.fontStyle = "bold";
          } else {
            hookData.cell.styles.textColor = [239, 68, 68];
            hookData.cell.styles.fontStyle = "bold";
          }
        }
      },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // Issues Table
  if (data.issues.length > 0) {
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 100, 100);
    doc.text(`Pendências Identificadas (${data.issues.length})`, 14, y);
    y += 6;

    const severityLabels: Record<string, string> = {
      critica: "CRÍTICA",
      alta: "ALTA",
      media: "MÉDIA",
    };

    const typeLabels: Record<string, string> = {
      assinatura_ausente: "Assinatura Ausente",
      presenca_sem_evolucao: "Presença sem Evolução",
      falta_sem_justificativa: "Falta sem Justificativa",
      sem_validacao_responsavel: "Sem Validação Responsável",
      guia_vencida: "Guia Vencida",
      guia_vencendo: "Guia Próxima do Vencimento",
      carga_horaria_excedida: "Carga Horária Excedida",
      sem_plano_terapeutico: "Sem Plano Terapêutico",
      plano_desatualizado: "Plano Desatualizado",
      evolucao_mensal_pendente: "Evolução Mensal Pendente",
      evolucao_mensal_nao_aprovada: "Evolução Mensal Não Aprovada",
    };

    autoTable(doc, {
      startY: y,
      head: [["Severidade", "Tipo", "Descrição", "Data"]],
      body: data.issues.map((issue) => [
        severityLabels[issue.severity] || issue.severity,
        typeLabels[issue.type] || issue.type,
        issue.message,
        issue.date || "-",
      ]),
      headStyles: { fillColor: [0, 128, 128], fontSize: 8 },
      bodyStyles: { fontSize: 7.5 },
      columnStyles: {
        0: { cellWidth: 22, halign: "center" },
        1: { cellWidth: 40 },
        2: { cellWidth: 85 },
        3: { cellWidth: 25 },
      },
      didParseCell: (hookData: any) => {
        if (hookData.section === "body" && hookData.column.index === 0) {
          const val = hookData.cell.raw;
          if (val === "CRÍTICA") {
            hookData.cell.styles.textColor = [220, 38, 38];
            hookData.cell.styles.fontStyle = "bold";
          } else if (val === "ALTA") {
            hookData.cell.styles.textColor = [234, 88, 12];
            hookData.cell.styles.fontStyle = "bold";
          } else {
            hookData.cell.styles.textColor = [217, 119, 6];
            hookData.cell.styles.fontStyle = "bold";
          }
        }
      },
    });
  }

  addFooter(doc);
  doc.save(`auditoria-faturamento-${data.month}-${data.year}.pdf`);
}
