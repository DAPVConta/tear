import { NavLink } from "react-router-dom";
import { Puzzle } from "lucide-react";
import { cn } from "@/lib/utils";
import { navSections, type NavItem } from "@/config/nav";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/providers/AuthProvider";

export function SidebarNav({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const { profile } = useAuth();
  const isPlatformAdmin = profile?.platform_role === "platform_admin";
  return (
    <nav className="flex flex-col gap-6">
      {navSections.map((section) => {
        const items = section.items.filter(
          (i) => !i.platformAdminOnly || isPlatformAdmin,
        );
        if (items.length === 0) return null;
        return (
          <div key={section.label}>
            {!collapsed && (
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-sidebar-foreground/55">
                {section.label}
              </p>
            )}
            <ul className="flex flex-col gap-1">
              {items.map((item) => (
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
        );
      })}
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
      style={{ ["--tea" as string]: item.accent }}
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
          <Icon
            className={cn(
              "h-5 w-5 shrink-0 transition-colors",
              isActive
                ? "text-[color:var(--tea)]"
                : "group-hover:text-[color:var(--tea)]",
            )}
          />
          {!collapsed && <span className="flex-1 truncate">{item.title}</span>}
          {/* Indicador ativo: peça de quebra-cabeça na cor TEA do item */}
          {isActive && !collapsed && (
            <Puzzle
              className="h-4 w-4 shrink-0"
              style={{ color: "var(--tea)" }}
              strokeWidth={2.5}
            />
          )}
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
