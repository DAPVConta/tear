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
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

export const navSections: NavSection[] = [
  {
    label: "Geral",
    items: [{ title: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Clínico",
    items: [
      { title: "Pacientes", href: "/pacientes", icon: Users },
      { title: "Profissionais", href: "/profissionais", icon: Stethoscope },
      { title: "Guias", href: "/guias", icon: FileCheck2 },
      { title: "Planos (PTS)", href: "/planos", icon: Target },
      { title: "Evolução diária", href: "/evolucoes", icon: ClipboardList },
      { title: "Evolução mensal", href: "/evolucao-mensal", icon: CalendarRange },
      { title: "Frequência", href: "/frequencia", icon: CalendarCheck },
    ],
  },
  {
    label: "Gestão",
    items: [
      { title: "Auditoria", href: "/auditoria", icon: ShieldCheck },
      { title: "Configurações", href: "/configuracoes", icon: Settings },
      { title: "Super Admin", href: "/super-admin", icon: Building2 },
    ],
  },
];
