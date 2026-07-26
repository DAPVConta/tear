import { CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";

// Renderização "executiva" do relatório mensal: cabeçalho de documento com a
// marca, faixa de indicadores, seções do texto parseadas (títulos numerados,
// listas e parágrafos) e bloco de assinatura. Apenas apresentação — não altera
// o conteúdo gerado pelo motor.

type Totals = { sessions: number; present: number; absent: number };

type Section = { title: string; items: string[] };

function isHeading(line: string): boolean {
  const t = line.trim();
  if (t.length < 3) return false;
  // Título de seção = caixa-alta (sem letras minúsculas) e com letras.
  return /[A-ZÀ-Ú]/.test(t) && t === t.toUpperCase() && !/[a-zà-ú]/.test(t);
}

function parseSections(text: string): Section[] {
  const sections: Section[] = [];
  let current: Section | null = null;
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    if (isHeading(line)) {
      current = { title: line, items: [] };
      sections.push(current);
    } else {
      if (!current) {
        current = { title: "", items: [] };
        sections.push(current);
      }
      current.items.push(line);
    }
  }
  return sections;
}

function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "success" | "danger";
}) {
  const toneClass =
    tone === "success"
      ? "text-emerald-600"
      : tone === "danger"
        ? "text-destructive"
        : "text-primary";
  return (
    <div className="rounded-xl border border-border bg-background/60 p-4 text-center">
      <p className={`text-3xl font-bold tabular-nums ${toneClass}`}>{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function SectionBlock({ index, section }: { index: number | null; section: Section }) {
  // Agrupa itens em corridas de bullets (• ...) e parágrafos.
  const out: Array<
    { type: "bullets"; items: string[] } | { type: "p"; text: string }
  > = [];
  for (const item of section.items) {
    if (item.startsWith("•")) {
      const text = item.replace(/^•\s*/, "");
      const last = out[out.length - 1];
      if (last && last.type === "bullets") last.items.push(text);
      else out.push({ type: "bullets", items: [text] });
    } else {
      out.push({ type: "p", text: item });
    }
  }

  return (
    <section>
      {section.title && (
        <div className="mb-2.5 flex items-center gap-2.5">
          {index !== null && (
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-primary/10 text-xs font-bold text-primary">
              {index}
            </span>
          )}
          <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
            {section.title}
          </h3>
        </div>
      )}
      <div className="space-y-2.5 text-sm leading-relaxed text-muted-foreground sm:pl-9">
        {out.map((b, i) =>
          b.type === "p" ? (
            <p key={i}>{b.text}</p>
          ) : (
            <ul key={i} className="space-y-1.5">
              {b.items.map((it, j) => (
                <li key={j} className="flex gap-2.5">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          ),
        )}
      </div>
    </section>
  );
}

export function ReportDocument({
  clinicName,
  patientName,
  professionalName,
  professionalRole,
  period,
  totals,
  summary,
  approved,
  dateLabel,
  signatureImage,
}: {
  clinicName: string;
  patientName: string;
  professionalName?: string;
  professionalRole?: string;
  period: string;
  totals: Totals;
  summary: string;
  approved: boolean;
  dateLabel: string;
  /** Rubrica digitalizada do profissional; já chega filtrada (só em documento assinado). */
  signatureImage?: string | null;
}) {
  const sections = parseSections(summary ?? "");
  let counter = 0;

  return (
    <Card className="overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-primary via-accent to-primary" />
      <div className="space-y-8 p-6 sm:p-9">
        {/* Cabeçalho do documento */}
        <header className="space-y-1.5 border-b border-border pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
            {clinicName}
          </p>
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Relatório de Evolução Terapêutica Mensal
          </h2>
          <p className="text-sm text-muted-foreground">
            {patientName} · {period}
            {professionalName ? ` · ${professionalName}` : ""}
          </p>
        </header>

        {/* Indicadores */}
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Sessões" value={totals.sessions} />
          <Stat label="Presenças" value={totals.present} tone="success" />
          <Stat label="Faltas" value={totals.absent} tone="danger" />
        </div>

        {/* Corpo do relatório */}
        <div className="space-y-7">
          {sections.map((s, i) => (
            <SectionBlock
              key={i}
              index={s.title ? ++counter : null}
              section={s}
            />
          ))}
        </div>

        {/* Assinatura */}
        <footer className="border-t border-border pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              {signatureImage && (
                <img
                  src={signatureImage}
                  alt={`Assinatura de ${professionalName ?? "profissional"}`}
                  className="mb-1 h-14 w-auto max-w-60 object-contain object-left dark:brightness-0 dark:invert"
                />
              )}
              <div className="h-px w-60 max-w-full bg-foreground/30" />
              <p className="mt-2 text-sm font-semibold text-foreground">
                {professionalName ?? "—"}
              </p>
              {professionalRole && (
                <p className="text-xs text-muted-foreground">{professionalRole}</p>
              )}
            </div>
            <div className="text-xs">
              {approved ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Aprovado e assinado em{" "}
                  {dateLabel}
                </span>
              ) : (
                <span className="text-muted-foreground">
                  Emitido em {dateLabel} · aguardando aprovação
                </span>
              )}
            </div>
          </div>
        </footer>
      </div>
    </Card>
  );
}
