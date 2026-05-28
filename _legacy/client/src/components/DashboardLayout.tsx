import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  LayoutDashboard,
  LogOut,
  PanelLeft,
  Users,
  UserCog,
  FileText,
  ClipboardList,
  Calendar,
  BarChart3,
  Shield,
  BookOpen,
  CreditCard,
  Building2,
  Crown,
  Puzzle,
  ChevronRight,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";

const menuSections = [
  {
    label: "Atendimento",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", color: "text-tea-blue" },
      { icon: Users, label: "Pacientes", path: "/pacientes", color: "text-tea-teal" },
      { icon: UserCog, label: "Profissionais", path: "/profissionais", color: "text-tea-purple" },
    ],
  },
  {
    label: "Documentação Clínica",
    items: [
      { icon: FileText, label: "Guias/Autorizações", path: "/guias", color: "text-tea-amber" },
      { icon: BookOpen, label: "Planos Terapêuticos", path: "/planos", color: "text-tea-green" },
      { icon: ClipboardList, label: "Evolução Diária", path: "/evolucoes", color: "text-tea-blue" },
      { icon: BarChart3, label: "Evolução Mensal", path: "/evolucao-mensal", color: "text-tea-teal" },
    ],
  },
  {
    label: "Gestão",
    items: [
      { icon: Calendar, label: "Frequência", path: "/frequencia", color: "text-tea-purple" },
      { icon: Shield, label: "Auditoria", path: "/auditoria", color: "text-tea-rose" },
    ],
  },
];

const settingsItems = [
  { icon: Building2, label: "Clínica", path: "/settings/clinic", color: "text-muted-foreground" },
  { icon: CreditCard, label: "Assinatura", path: "/settings/billing", color: "text-muted-foreground" },
];

const allMenuItems = menuSections.flatMap((s) => s.items);

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 270;
const MIN_WIDTH = 220;
const MAX_WIDTH = 400;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[oklch(0.96_0.02_250)] via-[oklch(0.97_0.015_200)] to-[oklch(0.98_0.01_290)]">
        <div className="flex flex-col items-center gap-8 p-10 max-w-md w-full bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50">
          <div className="flex flex-col items-center gap-5">
            <div className="relative">
              <div className="absolute -inset-3 bg-gradient-to-br from-tea-blue/20 to-tea-teal/20 rounded-full blur-xl" />
              <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-tea-blue to-tea-teal flex items-center justify-center shadow-lg">
                <Puzzle className="w-10 h-10 text-white" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-tea-blue to-tea-teal bg-clip-text text-transparent">
                PEET
              </h1>
              <p className="text-sm font-medium text-foreground/80">
                Prontuário Eletrônico de Evolução Terapêutica
              </p>
              <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                Sistema especializado para clínicas que atendem pacientes com TEA.
                Documentação auditável e blindagem anti-glosa.
              </p>
            </div>
          </div>
          <Button
            onClick={() => { window.location.href = getLoginUrl(); }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-tea-blue to-tea-teal hover:opacity-90 text-white font-semibold h-12 rounded-xl"
          >
            Entrar no Sistema
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = [...allMenuItems, ...settingsItems].find(
    (item) => location === item.path || (item.path !== "/dashboard" && location.startsWith(item.path))
  );
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r-0" disableTransition={isResizing}>
          {/* Header */}
          <SidebarHeader className="h-16 justify-center border-b border-sidebar-border/50">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-sidebar-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed && (
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-tea-blue to-tea-teal flex items-center justify-center shrink-0">
                    <Puzzle className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-bold tracking-tight truncate bg-gradient-to-r from-tea-blue to-tea-teal bg-clip-text text-transparent text-lg">
                    PEET
                  </span>
                </div>
              )}
            </div>
          </SidebarHeader>

          {/* Navigation */}
          <SidebarContent className="gap-0 py-2">
            {menuSections.map((section) => (
              <div key={section.label}>
                <div className="px-4 pt-4 pb-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 group-data-[collapsible=icon]:hidden">
                    {section.label}
                  </p>
                </div>
                <SidebarMenu className="px-2 gap-0.5">
                  {section.items.map((item) => {
                    const isActive = location === item.path || (item.path !== "/dashboard" && location.startsWith(item.path));
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          isActive={isActive}
                          onClick={() => setLocation(item.path)}
                          tooltip={item.label}
                          className={`h-9 transition-all font-medium text-[13px] rounded-lg ${
                            isActive
                              ? "bg-primary/8 text-primary font-semibold shadow-sm"
                              : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
                          }`}
                        >
                          <item.icon className={`h-[18px] w-[18px] ${isActive ? item.color : "text-muted-foreground/60"}`} />
                          <span>{item.label}</span>
                          {isActive && !isCollapsed && (
                            <ChevronRight className="ml-auto h-3.5 w-3.5 text-primary/50" />
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </div>
            ))}

            {/* Settings */}
            <div>
              <div className="px-4 pt-4 pb-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 group-data-[collapsible=icon]:hidden">
                  Configurações
                </p>
              </div>
              <SidebarMenu className="px-2 gap-0.5">
                {settingsItems.map((item) => {
                  const isActive = location.startsWith(item.path);
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => setLocation(item.path)}
                        tooltip={item.label}
                        className={`h-9 transition-all font-medium text-[13px] rounded-lg ${
                          isActive
                            ? "bg-primary/8 text-primary font-semibold shadow-sm"
                            : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
                        }`}
                      >
                        <item.icon className={`h-[18px] w-[18px] ${isActive ? "text-primary" : "text-muted-foreground/60"}`} />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </div>

            {/* Super Admin */}
            {(user?.role === "admin" || user?.role === "platform_admin") && (
              <div>
                <div className="px-4 pt-4 pb-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 group-data-[collapsible=icon]:hidden">
                    Plataforma
                  </p>
                </div>
                <SidebarMenu className="px-2">
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={location === "/super-admin"}
                      onClick={() => setLocation("/super-admin")}
                      tooltip="Super Admin"
                      className={`h-9 transition-all font-medium text-[13px] rounded-lg ${
                        location === "/super-admin"
                          ? "bg-tea-amber/10 text-tea-amber font-semibold"
                          : "text-sidebar-foreground/70 hover:text-sidebar-foreground"
                      }`}
                    >
                      <Crown className="h-[18px] w-[18px] text-tea-amber" />
                      <span>Super Admin</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </div>
            )}
          </SidebarContent>

          {/* Footer - User Profile */}
          <SidebarFooter className="p-3 border-t border-sidebar-border/50">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-sidebar-accent/60 transition-all w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9 shrink-0 ring-2 ring-tea-blue/20">
                    <AvatarFallback className="text-xs font-bold bg-gradient-to-br from-tea-blue/15 to-tea-teal/15 text-tea-blue">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-semibold truncate leading-none text-sidebar-foreground">
                      {user?.name || "-"}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate mt-1">
                      {user?.email || "-"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 rounded-xl">
                <div className="px-3 py-2">
                  <p className="text-sm font-semibold">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive rounded-lg mx-1"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair do sistema</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        {/* Resize handle */}
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => { if (!isCollapsed) setIsResizing(true); }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {/* Mobile header */}
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="h-9 w-9 rounded-lg" />
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-tea-blue to-tea-teal flex items-center justify-center">
                  <Puzzle className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="tracking-tight text-foreground font-semibold text-sm">
                  {activeMenuItem?.label ?? "PEET"}
                </span>
              </div>
            </div>
          </div>
        )}
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </>
  );
}
