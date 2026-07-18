import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { navSections } from "@/config/nav";

// Resolve o item de navegação da rota atual (prefixo mais longo) para
// herdar ícone e cor TEA — mantém o cabeçalho coeso com a sidebar.
function useRouteNav() {
  const { pathname } = useLocation();
  const items = navSections.flatMap((s) => s.items);
  return items
    .filter((i) => pathname === i.href || pathname.startsWith(`${i.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];
}

export function PageHeader({
  title,
  description,
  actions,
  className,
  icon,
  accent,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
  // Overrides opcionais; por padrão herda da rota (config/nav).
  icon?: LucideIcon;
  accent?: string;
}) {
  const nav = useRouteNav();
  const Icon = icon ?? nav?.icon;
  const tea = accent ?? nav?.accent;

  return (
    <div
      className={cn(
        "mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="flex items-start gap-4">
        {Icon && tea && (
          <span
            className="mt-0.5 grid h-12 w-12 shrink-0 place-items-center rounded-2xl border shadow-soft"
            style={{
              color: tea,
              borderColor: `color-mix(in srgb, ${tea} 25%, transparent)`,
              background: `color-mix(in srgb, ${tea} 12%, transparent)`,
            }}
            aria-hidden
          >
            <Icon className="h-6 w-6" />
          </span>
        )}
        <div className="space-y-1.5">
          <h1 className="text-[1.75rem] font-extrabold leading-tight tracking-tight lg:text-h1">
            {title}
          </h1>
          {tea && (
            <span
              className="block h-1 w-9 rounded-full"
              style={{ backgroundColor: tea }}
              aria-hidden
            />
          )}
          {description && (
            <p className="max-w-2xl text-sm text-muted-foreground lg:text-base">
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
