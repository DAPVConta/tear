import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { navSections, type NavItem } from "@/config/nav";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function SidebarNav({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-6">
      {navSections.map((section) => (
        <div key={section.label}>
          {!collapsed && (
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-sidebar-foreground/55">
              {section.label}
            </p>
          )}
          <ul className="flex flex-col gap-1">
            {section.items.map((item) => (
              <li key={item.href}>
                <SidebarNavItem
                  item={item}
                  collapsed={collapsed}
                  onNavigate={onNavigate}
                />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function SidebarNavItem({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const link = (
    <NavLink
      to={item.href}
      onClick={onNavigate}
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
          {isActive && !collapsed && (
            <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-sidebar-accent" />
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
