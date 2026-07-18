import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { navSections, type NavItem } from "@/config/nav";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/providers/AuthProvider";
import { prefetchPage } from "@/routes/pages";

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
    <nav className="flex flex-col gap-5">
      {navSections.map((section, index) => {
        const items = section.items.filter(
          (i) => !i.platformAdminOnly || isPlatformAdmin,
        );
        if (items.length === 0) return null;
        return (
          <div key={section.label}>
            {collapsed ? (
              index > 0 && (
                <div className="mx-auto mb-3 h-px w-8 bg-white/10" />
              )
            ) : (
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-sidebar-foreground/50">
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
  const prefetch = () => prefetchPage(item.href);
  const link = (
    <NavLink
      to={item.href}
      onClick={onNavigate}
      onMouseEnter={prefetch}
      onFocus={prefetch}
      onTouchStart={prefetch}
      style={{ ["--tea" as string]: item.accent }}
      className={({ isActive }) =>
        cn(
          "group relative flex items-center gap-3 rounded-xl py-1.5 pl-1.5 pr-3 text-sm font-semibold outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-white/40",
          collapsed && "justify-center px-0",
          isActive
            ? "bg-white/[0.13] text-white shadow-[inset_0_1px_0_0_rgb(255_255_255_/_0.08)]"
            : "text-sidebar-foreground/65 hover:bg-white/[0.07] hover:text-white",
        )
      }
    >
      {({ isActive }) => (
        <>
          {/* Indicador ativo: barra na cor TEA do item, rente à borda */}
          <span
            className={cn(
              "absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full transition-all duration-200",
              isActive ? "opacity-100" : "opacity-0",
            )}
            style={{
              backgroundColor: "var(--tea)",
              boxShadow: isActive ? "0 0 12px var(--tea)" : undefined,
            }}
          />
          {/* Ícone em chip com a cor TEA (diversidade da marca) */}
          <span
            className={cn(
              "grid h-9 w-9 shrink-0 place-items-center rounded-[0.65rem] transition-all duration-200",
              isActive
                ? "bg-[color-mix(in_srgb,var(--tea)_24%,transparent)]"
                : "bg-white/[0.06] group-hover:bg-[color-mix(in_srgb,var(--tea)_14%,transparent)]",
            )}
            style={{ color: "var(--tea)" }}
          >
            <Icon
              className="h-[18px] w-[18px]"
              strokeWidth={isActive ? 2.4 : 2}
            />
          </span>
          {!collapsed && <span className="flex-1 truncate">{item.title}</span>}
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
