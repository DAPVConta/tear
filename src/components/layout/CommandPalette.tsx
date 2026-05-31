import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { Users, Stethoscope, Plus, ArrowRight } from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { navSections } from "@/config/nav";
import { useAuth } from "@/providers/AuthProvider";
import { usePatientOptions } from "@/features/patients/api";
import { useProfessionalOptions } from "@/features/professionals/api";

// Contexto para abrir a palette de qualquer lugar (botão da Topbar, atalho).
const CommandPaletteContext = createContext<{ open: () => void } | undefined>(
  undefined,
);

export function useCommandPalette() {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx)
    throw new Error("useCommandPalette deve ser usado dentro do provider");
  return ctx;
}

// Ações rápidas (criar novo registro).
const quickActions = [
  { label: "Novo paciente", href: "/pacientes/novo", icon: Users },
  { label: "Novo profissional", href: "/profissionais/novo", icon: Stethoscope },
  { label: "Gerar evolução mensal", href: "/evolucao-mensal/gerar", icon: Plus },
];

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isPlatformAdmin = profile?.platform_role === "platform_admin";

  // Carrega options só quando a palette abre (sem custo no boot).
  const { data: patients } = usePatientOptions();
  const { data: professionals } = useProfessionalOptions();

  // Atalho ⌘K / Ctrl+K global.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function go(href: string) {
    setOpen(false);
    navigate(href);
  }

  const navItems = navSections.flatMap((s) =>
    s.items
      .filter((i) => !i.platformAdminOnly || isPlatformAdmin)
      .map((i) => ({ ...i, section: s.label })),
  );

  return (
    <CommandPaletteContext.Provider value={{ open: () => setOpen(true) }}>
      {children}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Buscar pacientes, profissionais, telas..." />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>

          <CommandGroup heading="Ações rápidas">
            {quickActions.map((a) => {
              const Icon = a.icon;
              return (
                <CommandItem
                  key={a.href}
                  value={`acao ${a.label}`}
                  onSelect={() => go(a.href)}
                >
                  <Icon />
                  {a.label}
                </CommandItem>
              );
            })}
          </CommandGroup>

          {patients && patients.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Pacientes">
                {patients.slice(0, 8).map((p) => (
                  <CommandItem
                    key={`pac-${p.id}`}
                    value={`paciente ${p.name}`}
                    onSelect={() => go(`/pacientes/${p.id}`)}
                  >
                    <Users />
                    {p.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {professionals && professionals.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Profissionais">
                {professionals.slice(0, 8).map((p) => (
                  <CommandItem
                    key={`prof-${p.id}`}
                    value={`profissional ${p.name}`}
                    onSelect={() => go(`/profissionais/${p.id}`)}
                  >
                    <Stethoscope />
                    {p.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          <CommandSeparator />
          <CommandGroup heading="Ir para">
            {navItems.map((i) => {
              const Icon = i.icon;
              return (
                <CommandItem
                  key={i.href}
                  value={`tela ${i.title} ${i.section}`}
                  onSelect={() => go(i.href)}
                >
                  <Icon />
                  {i.title}
                  <ArrowRight className="ml-auto opacity-0 transition-opacity aria-selected:opacity-60" />
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </CommandPaletteContext.Provider>
  );
}
