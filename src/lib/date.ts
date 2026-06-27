import { differenceInCalendarDays } from "date-fns";

// "yyyy-MM-dd" → Date interpretada como meia-noite LOCAL.
// parseISO trataria como meia-noite UTC, e em fuso BR (UTC-3) o format
// devolveria o dia anterior ("21/06/2026" em vez de "22/06/2026") — usar
// SEMPRE este helper para colunas Postgres do tipo `date`. Para timestamptz
// (`created_at`, `signed_at` etc.) continuar com parseISO.
export function parseDateOnly(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

// Hoje em "yyyy-MM-dd" no fuso local (o que o usuário entende como "hoje").
export function todayLocalISO(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Dias entre hoje e uma data (yyyy-MM-dd). Negativo = no passado.
export function daysUntil(dateOnly: string): number {
  return differenceInCalendarDays(parseDateOnly(dateOnly), new Date());
}
