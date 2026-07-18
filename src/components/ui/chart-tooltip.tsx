// Tooltip compartilhado dos gráficos Recharts — visual do design system
// (popover, borda, sombra elevada) no lugar do estilo default da lib.
type TooltipEntry = {
  value?: number | string;
  name?: string;
  color?: string;
  payload?: { fill?: string };
};

export function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-popover px-3.5 py-2.5 shadow-elevated">
      {label != null && label !== "" && (
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </p>
      )}
      <div className="mt-1 space-y-1">
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-[4px]"
              style={{
                backgroundColor: entry.color ?? entry.payload?.fill ?? "#1E88FF",
              }}
            />
            <span className="font-bold tabular-nums text-popover-foreground">
              {entry.value}
            </span>
            {entry.name && (
              <span className="text-muted-foreground">{entry.name}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
