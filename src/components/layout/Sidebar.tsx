import { NavLink } from "react-router-dom";
import { ChevronsLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { navSections } from "@/config/nav";
import { Logo, LogoMark } from "@/components/brand/Logo";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
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
          <LogoMark className="h-10 w-10" />
        ) : (
          <Logo markClassName="h-10 w-10" />
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
        <nav className="flex flex-col gap-6">
          {navSections.map((section) => (
            <div key={section.label}>
              {!collapsed && (
                <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-sidebar-foreground/45">
                  {section.label}
                </p>
              )}
              <ul className="flex flex-col gap-1">
                {section.items.map((item) => (
                  <li key={item.href}>
                    <NavItemLink item={item} collapsed={collapsed} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
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

function NavItemLink({
  item,
  collapsed,
}: {
  item: (typeof navSections)[number]["items"][number];
  collapsed: boolean;
}) {
  const Icon = item.icon;
  const link = (
    <NavLink
      to={item.href}
      className={({ isActive }) =>
        cn(
          "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all",
          collapsed && "justify-center px-0",
          isActive
            ? "bg-white/15 text-white shadow-soft"
            : "text-sidebar-foreground/70 hover:bg-white/10 hover:text-white",
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute left-0 top-1/2 h-6 -translate-y-1/2 rounded-r-full bg-sidebar-accent transition-all w-1" />
          )}
          <Icon className="h-5 w-5 shrink-0" />
          {!collapsed && <span className="truncate">{item.title}</span>}
        </>
      )}
    </NavLink>
  );

  if (!collapsed) return link;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.title}</TooltipContent>
    </Tooltip>
  );
}
