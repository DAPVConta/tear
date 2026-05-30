import { useEffect, useState, type CSSProperties } from "react";
import { DayPicker } from "react-day-picker";
import { ptBR } from "date-fns/locale";
import { format, parse, parseISO, isValid } from "date-fns";
import { Calendar, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import "react-day-picker/style.css";

// Variáveis do react-day-picker mapeadas para os tokens da identidade TEAR.
const rdpStyle: CSSProperties = {
  // @ts-expect-error -- CSS custom properties não são tipadas em CSSProperties
  "--rdp-accent-color": "hsl(var(--primary))",
  "--rdp-accent-background-color": "hsl(var(--accent) / 0.12)",
  "--rdp-day-height": "2.25rem",
  "--rdp-day-width": "2.25rem",
};

// Máscara dd/mm/aaaa a partir dos dígitos digitados.
function maskDate(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 8);
  const dd = digits.slice(0, 2);
  const mm = digits.slice(2, 4);
  const yyyy = digits.slice(4, 8);
  return [dd, mm, yyyy].filter((p) => p !== "").join("/");
}

export function DatePicker({
  value,
  onChange,
  placeholder = "dd/mm/aaaa",
  disabled,
  className,
  clearable = true,
}: {
  value: string; // "yyyy-MM-dd"
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  clearable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? parseISO(value) : undefined;
  const valid = !!selected && isValid(selected);
  const [text, setText] = useState(valid ? format(selected!, "dd/MM/yyyy") : "");

  // Mantém o texto em sincronia quando o valor externo muda (reset, calendário).
  useEffect(() => {
    const s = value ? parseISO(value) : undefined;
    setText(s && isValid(s) ? format(s, "dd/MM/yyyy") : "");
  }, [value]);

  // Digitação: aplica máscara e, quando a data está completa e válida,
  // propaga no formato ISO. Campo vazio limpa o valor.
  function handleType(raw: string) {
    const masked = maskDate(raw);
    setText(masked);
    if (masked === "") {
      onChange("");
      return;
    }
    if (masked.length === 10) {
      const parsed = parse(masked, "dd/MM/yyyy", new Date());
      if (isValid(parsed)) onChange(format(parsed, "yyyy-MM-dd"));
    }
  }

  const showClear = clearable && text !== "" && !disabled;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className={cn("relative", className)}>
        <Input
          type="text"
          inputMode="numeric"
          disabled={disabled}
          value={text}
          placeholder={placeholder}
          onChange={(e) => handleType(e.target.value)}
          className={showClear ? "pr-16" : "pr-10"}
        />
        {showClear && (
          <button
            type="button"
            onClick={() => {
              setText("");
              onChange("");
            }}
            aria-label="Limpar data"
            className="absolute right-9 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        )}
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            aria-label="Abrir calendário"
            className="absolute right-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Calendar className="h-4 w-4" />
          </button>
        </PopoverTrigger>
      </div>
      <PopoverContent className="w-auto p-2" align="start">
        <DayPicker
          mode="single"
          locale={ptBR}
          selected={valid ? selected : undefined}
          defaultMonth={valid ? selected : undefined}
          onSelect={(d) => {
            if (d) {
              onChange(format(d, "yyyy-MM-dd"));
              setOpen(false);
            }
          }}
          showOutsideDays
          style={rdpStyle}
        />
      </PopoverContent>
    </Popover>
  );
}
