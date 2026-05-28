import { forwardRef, type TextareaHTMLAttributes } from "react";
import { Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDictation } from "@/hooks/useDictation";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Props = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "value" | "onChange"
> & {
  value: string;
  onChange: (value: string) => void;
};

// Textarea com botão de ditado por voz (Web Speech API nativa do navegador).
// O resultado é anexado ao valor atual do campo, separado por espaço.
export const DictatedTextarea = forwardRef<HTMLTextAreaElement, Props>(
  ({ value, onChange, className, ...props }, ref) => {
    const { supported, listening, start, stop } = useDictation({
      onResult: (text) => {
        const sep = !value || /\s$/.test(value) ? "" : " ";
        onChange(`${value ?? ""}${sep}${text}`);
      },
    });

    return (
      <div className="relative">
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "flex w-full rounded-lg border border-input bg-background py-2 pl-3.5 pr-12 text-sm shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            className,
          )}
          {...props}
        />
        {supported && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={listening ? stop : start}
                aria-label={listening ? "Parar ditado" : "Ditar por voz"}
                className={cn(
                  "absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
                  listening &&
                    "border-destructive/40 bg-destructive/10 text-destructive animate-pulse",
                )}
              >
                {listening ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="left">
              {listening ? "Parar ditado" : "Ditar por voz (pt-BR)"}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    );
  },
);
DictatedTextarea.displayName = "DictatedTextarea";
