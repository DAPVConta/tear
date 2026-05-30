import { ChevronsLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo, LogoMark } from "@/components/brand/Logo";
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
        "relative z-30 hidden shrink-0 flex-col bg-brand-radial text-sidebar-foreground transition-[width] duration-300 ease-in-out lg:flex",
        collapsed ? "w-[5rem]" : "w-72",
      )}
    >
      {/* Brilho decorativo */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/10 to-transparent" />

      <div
        className={cn(
          "flex h-16 items-center px-4",
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        {collapsed ? (
          <LogoMark className="h-10 w-10" src={logoUrl} />
        ) : (
          <Logo markClassName="h-10 w-10" src={logoUrl} />
        )}
        {!collapsed && (
          <button
            onClick={onToggle}
            aria-label="Recolher menu"
            className="grid h-8 w-8 place-items-center rounded-md text-sidebar-foreground/70 transition-colors hover:bg-white/10 hover:text-sidebar-foreground"
          >
            <ChevronsLeft className="h-5 w-5" />
          </button>
        )}
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <SidebarNav collapsed={collapsed} />
      </ScrollArea>

      {collapsed && (
        <button
          onClick={onToggle}
          aria-label="Expandir menu"
          className="mx-auto mb-4 grid h-9 w-9 place-items-center rounded-md text-sidebar-foreground/70 transition-colors hover:bg-white/10 hover:text-sidebar-foreground"
        >
          <ChevronsLeft className="h-5 w-5 rotate-180" />
        </button>
      )}
    </aside>
  );
}
