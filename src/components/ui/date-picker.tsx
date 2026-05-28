import { useState, type CSSProperties } from "react";
import { DayPicker } from "react-day-picker";
import { ptBR } from "date-fns/locale";
import { format, parseISO, isValid } from "date-fns";
import { Calendar, X } from "lucide-react";
import { cn } from "@/lib/utils";
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

export function DatePicker({
  value,
  onChange,
  placeholder = "Selecione a data",
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
  const valid = selected && isValid(selected);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-11 w-full items-center justify-between rounded-lg border border-input bg-background px-3.5 py-2 text-sm shadow-soft transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
            !valid && "text-muted-foreground",
            className,
          )}
        >
          <span className="flex items-center gap-2">
            <Calendar className="h-4 w-4 opacity-60" />
            {valid ? format(selected!, "dd/MM/yyyy") : placeholder}
          </span>
          {clearable && valid && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="grid h-5 w-5 place-items-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label="Limpar data"
            >
              <X className="h-3 w-3" />
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <DayPicker
          mode="single"
          locale={ptBR}
          selected={selected}
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
