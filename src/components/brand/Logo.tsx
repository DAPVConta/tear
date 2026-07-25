import { cn } from "@/lib/utils";

// Ativos oficiais da marca TEAR (Supabase Storage, bucket público `Logo`).
// Logo = lockup completo (ícone + wordmark); mark = ícone quadrado (favicon).
// `white` = versão monocromática branca para fundos escuros (ex.: login).
const BRAND_LOGO_URL =
  "https://kfjsyeopooxipnnxcdkz.supabase.co/storage/v1/object/public/Logo/tear_logo_redim.png";
const BRAND_LOGO_WHITE_URL =
  "https://kfjsyeopooxipnnxcdkz.supabase.co/storage/v1/object/public/Logo/tear_logo_branco2.png";
const BRAND_MARK_URL =
  "https://kfjsyeopooxipnnxcdkz.supabase.co/storage/v1/object/public/Logo/tear_favicon.png";

// Ícone quadrado da marca. Quando `src` é fornecido, renderiza a logo
// customizada do tenant; caso contrário, usa o ícone oficial TEAR.
export function LogoMark({
  className,
  src,
}: {
  className?: string;
  src?: string | null;
}) {
  return (
    <span
      className={cn(
        "grid place-items-center overflow-hidden rounded-xl bg-white shadow-soft",
        className,
      )}
    >
      <img
        src={src ?? BRAND_MARK_URL}
        alt={src ? "Logo da clínica" : "TEAR"}
        className="h-full w-full object-contain p-1"
      />
    </span>
  );
}

// Barras coloridas da marca (diversidade e desenvolvimento). Elemento
// decorativo reutilizável — hero, sidebar, cards.
export function TeaBars({
  className,
  barClassName,
}: {
  className?: string;
  barClassName?: string;
}) {
  return (
    <span className={cn("flex items-center gap-1", className)} aria-hidden>
      {["#1E88FF", "#45C7FF", "#FFC400", "#FF2D2D"].map((color) => (
        <span
          key={color}
          className={cn("h-1 w-6 rounded-full", barClassName)}
          style={{ backgroundColor: color }}
        />
      ))}
    </span>
  );
}

export function Wordmark({
  className,
  showTagline = false,
}: {
  className?: string;
  showTagline?: boolean;
}) {
  return (
    <div className={cn("flex flex-col leading-none", className)}>
      <span className="font-display text-xl font-extrabold tracking-tight">
        TEAR
      </span>
      {showTagline && (
        <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.18em] opacity-70">
          Prontuário Inteligente
        </span>
      )}
    </div>
  );
}

export function Logo({
  className,
  markClassName,
  src,
  variant = "color",
}: {
  className?: string;
  markClassName?: string;
  src?: string | null;
  // "white" usa a logo monocromática branca (fundos escuros, ex.: login).
  variant?: "color" | "white";
}) {
  // Com logo customizada, exibimos só a marca do tenant (sem wordmark TEAR).
  if (src) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <LogoMark className={cn("h-10 w-10", markClassName)} src={src} />
      </div>
    );
  }
  // Marca oficial TEAR (lockup completo) em todas as telas públicas.
  return (
    <div className={cn("flex items-center", className)}>
      <img
        src={variant === "white" ? BRAND_LOGO_WHITE_URL : BRAND_LOGO_URL}
        alt="TEAR — Prontuário Inteligente para Clínicas de TEA"
        className={cn("h-10 w-auto object-contain", markClassName)}
      />
    </div>
  );
}
