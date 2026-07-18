import {
  LayoutDashboard,
  Users,
  Stethoscope,
  FileCheck2,
  Target,
  ClipboardList,
  CalendarCheck,
  CalendarRange,
  ShieldCheck,
  Settings,
  Building2,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  // Cor da identidade TEA (paleta da marca) usada no chip/estados do item.
  accent: string;
  // Tinta do ícone sobre o chip colorido (default branco); o amarelo exige
  // tinta escura para contraste.
  onAccent?: string;
  // Quando true, item visível apenas para platform_admin.
  platformAdminOnly?: boolean;
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

// Paleta TEA (diversidade) — sem o azul-escuro, que some no fundo da sidebar.
const TEA = {
  blue: "#1E88FF",
  cyan: "#45C7FF",
  yellow: "#FFC400",
  red: "#FF2D2D",
};

export const navSections: NavSection[] = [
  {
    label: "Geral",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, accent: TEA.cyan },
    ],
  },
  {
    label: "Clínico",
    items: [
      { title: "Pacientes", href: "/pacientes", icon: Users, accent: TEA.blue },
      { title: "Profissionais", href: "/profissionais", icon: Stethoscope, accent: TEA.cyan },
      { title: "Guias", href: "/guias", icon: FileCheck2, accent: TEA.yellow, onAccent: "#3D2F00" },
      { title: "Planos (PTS)", href: "/planos", icon: Target, accent: TEA.red },
      { title: "Evolução diária", href: "/evolucoes", icon: ClipboardList, accent: TEA.blue },
      { title: "Evolução mensal", href: "/evolucao-mensal", icon: CalendarRange, accent: TEA.cyan },
      { title: "Frequência", href: "/frequencia", icon: CalendarCheck, accent: TEA.yellow, onAccent: "#3D2F00" },
    ],
  },
  {
    label: "Gestão",
    items: [
      { title: "Auditoria", href: "/auditoria", icon: ShieldCheck, accent: TEA.red },
      { title: "Configurações", href: "/configuracoes", icon: Settings, accent: TEA.cyan },
      {
        title: "Super Admin",
        href: "/super-admin",
        icon: Building2,
        accent: TEA.blue,
        platformAdminOnly: true,
      },
    ],
  },
];
