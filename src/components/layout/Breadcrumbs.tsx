import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export type Crumb = { label: string; href?: string };

// Trilha de navegação para telas internas/detalhe. Sóbria, opcional —
// usar onde dá contexto (ex.: Pacientes › João › Editar).
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Trilha de navegação" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1.5 text-caption text-muted-foreground">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i} className="flex items-center gap-1.5">
              {c.href && !last ? (
                <Link
                  to={c.href}
                  className="rounded transition-colors hover:text-foreground"
                >
                  {c.label}
                </Link>
              ) : (
                <span className={last ? "font-medium text-foreground" : undefined}>
                  {c.label}
                </span>
              )}
              {!last && (
                <ChevronRight className="h-3.5 w-3.5 opacity-50" aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
