import { Suspense, useState } from "react";
import { Outlet } from "react-router-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/Logo";
import { useClinic } from "@/providers/ClinicProvider";
import { Sidebar } from "./Sidebar";
import { SidebarNav } from "./SidebarNav";
import { Topbar } from "./Topbar";

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />

      {/* Drawer mobile */}
      <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenMobile={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl px-4 py-8 animate-fade-in lg:px-8 lg:py-10">
            <Suspense fallback={<RouteLoader />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}

// Loader não-intrusivo: barra fina no topo da área de conteúdo.
// A sidebar/topbar permanecem visíveis durante a troca de chunk.
function RouteLoader() {
  return (
    <div className="fixed inset-x-0 top-16 z-30 h-0.5 overflow-hidden lg:left-72">
      <div className="h-full w-1/3 animate-[route_1.1s_ease-in-out_infinite] bg-brand-gradient" />
      <style>{`
        @keyframes route {
          0%   { transform: translateX(-100%); }
          50%  { transform: translateX(180%); }
          100% { transform: translateX(380%); }
        }
      `}</style>
    </div>
  );
}

function MobileDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { clinic } = useClinic();
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 lg:hidden",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
    >
      <div
        className={cn(
          "absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity",
          open ? "opacity-100" : "opacity-0",
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          "absolute inset-y-0 left-0 flex w-72 flex-col bg-brand-radial text-sidebar-foreground shadow-elevated transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between px-4">
          <Logo src={clinic?.logo_url ?? null} />
          <button
            onClick={onClose}
            aria-label="Fechar menu"
            className="grid h-8 w-8 place-items-center rounded-md text-sidebar-foreground/70 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <SidebarNav onNavigate={onClose} />
        </div>
      </aside>
    </div>
  );
}
