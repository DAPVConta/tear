import { useNavigate } from "react-router-dom";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useClinic } from "@/providers/ClinicProvider";
import { memberRoleLabels } from "@/lib/labels";
import { cn, initials } from "@/lib/utils";

function ClinicBadge({ name, className }: { name?: string | null; className?: string }) {
  return (
    <span
      className={cn(
        "grid h-6 w-6 shrink-0 place-items-center rounded-md bg-brand-gradient text-[10px] font-bold text-white",
        className,
      )}
    >
      {initials(name, "C")}
    </span>
  );
}

/**
 * Tenant ativo no topo do app. Com um único vínculo é apenas o rótulo da
 * clínica — não oferecer um menu que não leva a lugar nenhum. Com mais de um,
 * vira seletor: a troca reinicia os caches e devolve o usuário ao dashboard,
 * porque a tela em que ele estava pode apontar para um registro de outra
 * clínica.
 */
export function ClinicSwitcher() {
  const { clinic, memberships, switchClinic } = useClinic();
  const navigate = useNavigate();

  const label = clinic?.name ?? "Minha Clínica";

  if (memberships.length <= 1) {
    return (
      <div className="hidden items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-semibold shadow-soft sm:flex">
        <ClinicBadge name={clinic?.name} />
        <span className="max-w-[12rem] truncate">{label}</span>
      </div>
    );
  }

  function handleSelect(clinicId: number) {
    if (clinicId === clinic?.id) return;
    switchClinic(clinicId);
    navigate("/dashboard");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Clínica ativa: ${label}. Trocar de clínica`}
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-1.5 text-sm font-semibold shadow-soft outline-none ring-ring transition-colors hover:border-accent/40 hover:bg-secondary focus-visible:ring-2 data-[state=open]:border-accent/40 data-[state=open]:bg-secondary sm:px-3"
        >
          <ClinicBadge name={clinic?.name} />
          {/* No celular sobra só a marca da clínica — o nome disputaria espaço
              com a busca. O seletor continua alcançável. */}
          <span className="hidden max-w-[12rem] truncate sm:inline">{label}</span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Suas clínicas</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {memberships.map(({ clinic: item, role }) => {
          const isActive = item.id === clinic?.id;
          return (
            <DropdownMenuItem
              key={item.id}
              onSelect={() => handleSelect(item.id)}
              className="gap-2"
            >
              <ClinicBadge name={item.name} className={isActive ? "" : "opacity-70"} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium text-foreground">
                  {item.name}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {memberRoleLabels[role]}
                </span>
              </span>
              {isActive && <Check className="h-4 w-4 shrink-0 text-accent" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
