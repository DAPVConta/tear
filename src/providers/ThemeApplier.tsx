import { useEffect } from "react";
import { useClinic } from "@/providers/ClinicProvider";
import { hexToHslString, type ClinicTheme } from "@/lib/colors";

// Aplica tokens de cor da clínica como CSS variables em runtime,
// permitindo trocar a paleta sem rebuild. Reseta ao desmontar/trocar.
export function ThemeApplier() {
  const { clinic } = useClinic();

  useEffect(() => {
    const root = document.documentElement;
    const theme = (clinic?.theme ?? {}) as ClinicTheme;

    const apply = (name: string, hex?: string) => {
      if (!hex) {
        root.style.removeProperty(name);
        return;
      }
      root.style.setProperty(name, hexToHslString(hex));
    };

    apply("--primary", theme.primary);
    apply("--accent", theme.accent);
    apply("--ring", theme.accent);
    apply("--sidebar", theme.primary);

    return () => {
      root.style.removeProperty("--primary");
      root.style.removeProperty("--accent");
      root.style.removeProperty("--ring");
      root.style.removeProperty("--sidebar");
    };
  }, [clinic?.theme]);

  return null;
}
