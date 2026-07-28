import { z } from "zod";

// Regra de senha do TEAR (dado clínico sob LGPD): pelo menos 8 caracteres,
// com letra e número. O mínimo do Supabase é 6 — aqui subimos a régua sem
// exigir composições difíceis de digitar no dia a dia da clínica.
export const MIN_PASSWORD_LENGTH = 8;

export const passwordSchema = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `Use pelo menos ${MIN_PASSWORD_LENGTH} caracteres`)
  .regex(/\p{L}/u, "Inclua pelo menos uma letra")
  .regex(/\d/, "Inclua pelo menos um número");

export type PasswordStrength = {
  // 0 = vazia; 1..4 = da mais frágil à mais forte.
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
};

// A partir do score 2 a senha já atende às regras; os rótulos refletem isso
// para não chamar de "fraca" uma senha que o formulário aceita.
const LABELS = ["", "Fraca", "Razoável", "Boa", "Forte"] as const;

// Medidor informativo (não é gate): soma sinais independentes de comprimento
// e variedade. O gate continua sendo o `passwordSchema`.
export function scorePassword(value: string): PasswordStrength {
  if (!value) return { score: 0, label: LABELS[0] };

  let points = 0;
  if (value.length >= MIN_PASSWORD_LENGTH) points++;
  if (value.length >= 12) points++;
  if (/\p{L}/u.test(value) && /\d/.test(value)) points++;
  if (/[^\p{L}\d]/u.test(value) || (/\p{Lu}/u.test(value) && /\p{Ll}/u.test(value)))
    points++;

  const score = Math.min(4, Math.max(1, points)) as 1 | 2 | 3 | 4;
  return { score, label: LABELS[score] };
}
