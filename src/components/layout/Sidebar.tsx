import { ChevronsLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo, LogoMark, TeaBars } from "@/components/brand/Logo";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useClinic } from "@/providers/ClinicProvider";
import { SidebarNav } from "./SidebarNav";

export function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const { clinic } = useClinic();
  const logoUrl = clinic?.logo_url ?? null;
  return (
    <aside
      className={cn(
        "relative z-30 hidden shrink-0 flex-col bg-sidebar-aurora text-sidebar-foreground transition-[width] duration-300 ease-in-out lg:flex",
        collapsed ? "w-[5.25rem]" : "w-72",
      )}
    >
      {/* Textura + brilhos decorativos */}
      <div className="pointer-events-none absolute inset-0 bg-noise opacity-[0.05]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/10 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-white/15 via-white/5 to-transparent" />

      {/* Primeira linha do menu com fundo branco — fixa/realça a logo. */}
      <div
        className={cn(
          "relative z-10 flex h-[4.5rem] items-center bg-white px-4",
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        {collapsed ? (
          <LogoMark className="h-14 w-14" src={logoUrl} framed={false} />
        ) : (
          <Logo
            markClassName={logoUrl ? "h-14 w-14" : "h-14"}
            src={logoUrl}
            framed={false}
          />
        )}
        {!collapsed && (
          <button
            onClick={onToggle}
            aria-label="Recolher menu"
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <ChevronsLeft className="h-5 w-5" />
          </button>
        )}
      </div>

      {collapsed && (
        <button
          onClick={onToggle}
          aria-label="Expandir menu"
          className="relative mx-auto mb-1 grid h-9 w-9 place-items-center rounded-lg text-sidebar-foreground/70 transition-colors hover:bg-white/10 hover:text-sidebar-foreground"
        >
          <ChevronsLeft className="h-5 w-5 rotate-180" />
        </button>
      )}

      <ScrollArea className="relative flex-1 px-3 py-4">
        <SidebarNav collapsed={collapsed} />
      </ScrollArea>

      {/* Rodapé: assinatura da marca (barras = diversidade) */}
      <div
        className={cn(
          "relative border-t border-white/10 px-4 py-4",
          collapsed && "px-0",
        )}
      >
        {collapsed ? (
          <TeaBars className="justify-center gap-1" barClassName="h-1 w-2.5" />
        ) : (
          <div className="flex items-center justify-between">
            <div className="leading-none">
              <p className="font-display text-xs font-extrabold tracking-tight">
                TEAR
              </p>
              <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/50">
                Prontuário Inteligente
              </p>
            </div>
            <TeaBars barClassName="h-1 w-4" />
          </div>
        )}
      </div>
    </aside>
  );
}
