import type { JSX } from "react";

export interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string | number;
    value?: number | string;
    color?: string;
    payload?: {
      rawValue?: number;
    };
  }>;
  label?: string;
  labelFormatter?: (label: string) => string;
  unit?: string;
  valueFormatter?: (value: number, name: string) => string;
}

export default function ChartTooltip(
  props: ChartTooltipProps,
): JSX.Element | null {
  const { active, payload, label, labelFormatter, unit, valueFormatter } =
    props;

  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="border border-border bg-surface rounded-md shadow-sm text-xs p-2 text-foreground">
      <div className="font-medium mb-1">
        {labelFormatter && label ? labelFormatter(label) : (label ?? "")}
      </div>
      {payload.map((entry, index) => {
        const name = String(entry.name ?? "");
        const rawValue =
          entry.payload?.rawValue ??
          (typeof entry.value === "number" ? entry.value : 0);
        const displayValue = valueFormatter
          ? valueFormatter(rawValue, name)
          : `${rawValue}${unit ? " " + unit : ""}`;

        return (
          <div key={index} className="flex items-center gap-1.5">
            <span
              className="inline-block w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: entry.color ?? "currentColor" }}
            />
            <span>
              {name}: {displayValue}
            </span>
          </div>
        );
      })}
    </div>
  );
}
