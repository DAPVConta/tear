import { useNavigate } from "react-router-dom";
import { Search, Menu, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/providers/AuthProvider";
import { initials } from "@/lib/utils";
import { ClinicSwitcher } from "./ClinicSwitcher";
import { useCommandPalette } from "./CommandPalette";

export function Topbar({ onOpenMobile }: { onOpenMobile: () => void }) {
  const navigate = useNavigate();
  const { profile, user, signOut } = useAuth();
  const { open: openPalette } = useCommandPalette();

  const displayName = profile?.name || user?.email || "Usuário";

  async function handleLogout() {
    await signOut();
    navigate("/login", { replace: true });
  }

  return (
    <header className="sticky top-0 z-20 flex h-[4.5rem] items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-lg lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        aria-label="Abrir menu"
        onClick={onOpenMobile}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Clínica atual (multi-tenant) — seletor quando há mais de um vínculo */}
      <ClinicSwitcher />

      <button
        type="button"
        onClick={openPalette}
        aria-label="Buscar (atalho Ctrl+K)"
        className="group ml-auto flex h-10 w-full max-w-sm items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm text-muted-foreground shadow-soft transition-colors hover:border-accent/40 hover:bg-secondary md:ml-0"
      >
        <Search className="h-4 w-4 transition-colors group-hover:text-accent" />
        <span className="flex-1 text-left">Buscar pacientes, telas...</span>
        <Kbd className="hidden md:inline-flex">⌘K</Kbd>
      </button>

      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-1 flex items-center gap-2 rounded-full outline-none ring-ring focus-visible:ring-2">
              <Avatar className="h-9 w-9 ring-2 ring-border">
                <AvatarFallback>{initials(displayName, "TR")}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <span className="block truncate font-semibold normal-case text-foreground">
                {displayName}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate("/configuracoes")}>
              <User /> Perfil
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={handleLogout}
              className="text-destructive focus:text-destructive"
            >
              <LogOut /> Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
