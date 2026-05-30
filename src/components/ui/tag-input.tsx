import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function TagInput({
  value,
  onChange,
  placeholder = "Digite e pressione Enter",
  disabled,
  className,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  const [draft, setDraft] = useState("");

  function add(raw: string) {
    const next = raw.trim();
    if (!next) return;
    if (value.includes(next)) return;
    onChange([...value, next]);
    setDraft("");
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
    } else if (e.key === "Backspace" && !draft && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div
      className={cn(
        "flex min-h-[2.75rem] flex-wrap items-center gap-1.5 rounded-lg border border-input bg-background px-2 py-1.5 shadow-soft transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1 focus-within:ring-offset-background",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      {value.map((tag, i) => (
        <span
          key={`${tag}-${i}`}
          className="inline-flex items-center gap-1 rounded-md bg-accent/12 px-2 py-1 text-xs font-semibold text-accent"
        >
          {tag}
          {!disabled && (
            <button
              type="button"
              onClick={() => remove(i)}
              className="grid h-4 w-4 place-items-center rounded hover:bg-accent/20"
              aria-label={`Remover ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKey}
        onBlur={() => draft && add(draft)}
        placeholder={value.length === 0 ? placeholder : ""}
        disabled={disabled}
        className="flex-1 bg-transparent px-1.5 py-0.5 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
      />
    </div>
  );
}
