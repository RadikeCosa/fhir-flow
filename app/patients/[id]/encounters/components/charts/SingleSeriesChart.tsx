"use client";

import type { TimeValueDatum } from "../../../../../../lib/patient/formatters/encounter-charts.formatters";
import {
  CLINICAL_CHART_COLORS,
  CLINICAL_CHART_RANGES,
  formatChartDate,
} from "../../../../../../lib/patient/formatters/encounter-charts.formatters";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";
import ChartTooltip from "./ChartTooltip";

export interface NormalRange {
  y1: number;
  y2: number;
}

export interface ReferenceZone {
  y1: number;
  y2: number;
  fill: string;
}

export interface SingleSeriesChartProps {
  data: TimeValueDatum[];
  label: string;
  unit: string;
  color: string;
  domain: [number, number];
  normalRange?: NormalRange;
  referenceZones?: ReferenceZone[];
  ticks?: number[];
  emptyMessage: string;
  tooltipValueFormatter?: (value: number) => string;
}

export default function SingleSeriesChart({
  data,
  label,
  unit,
  color,
  domain,
  normalRange,
  referenceZones,
  ticks,
  emptyMessage,
  tooltipValueFormatter,
}: SingleSeriesChartProps): React.JSX.Element {
  if (!data?.length) {
    return (
      <div
        role="status"
        className="flex items-center justify-center py-16 px-8 text-center text-sm text-muted"
      >
        {emptyMessage}
      </div>
    );
  }

  if (data.length === 1) {
    const point = data[0];
    const formattedValue = tooltipValueFormatter
      ? tooltipValueFormatter(point.value)
      : `${point.value} ${unit}`;

    return (
      <div
        role="status"
        className="flex flex-col items-center justify-center py-16 px-8 text-center"
      >
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-3xl font-bold" style={{ color }}>
          {formattedValue}
        </div>
        <div className="text-sm text-muted">{formatChartDate(point.date)}</div>
        <div className="text-sm text-muted mt-2">
          Solo hay un registro disponible
        </div>
      </div>
    );
  }

  const lastIndex = data.length - 1;

  return (
    <div
      role="img"
      aria-label={`Gráfico de ${label} — ${data.length} registros`}
      className="h-35 md:h-45 lg:h-55"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tickFormatter={formatChartDate} />
          {ticks ? (
            <YAxis domain={domain} ticks={ticks} />
          ) : (
            <YAxis domain={domain} />
          )}
          {normalRange ? (
            <ReferenceArea
              y1={normalRange.y1}
              y2={normalRange.y2}
              fill="#16a34a"
              fillOpacity={0.08}
            />
          ) : null}
          {referenceZones?.map((zone, index) => (
            <ReferenceArea
              key={index}
              y1={zone.y1}
              y2={zone.y2}
              fill={zone.fill}
              fillOpacity={0.08}
            />
          ))}
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            content={
              <ChartTooltip
                labelFormatter={formatChartDate}
                unit={unit}
                valueFormatter={tooltipValueFormatter}
              />
            }
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="value"
            name={label}
            stroke={color}
            dot={({ cx, cy, index }) =>
              index === lastIndex ? (
                <circle
                  key={`dot-${index}`}
                  cx={cx}
                  cy={cy}
                  r={4}
                  fill={color}
                  stroke="white"
                  strokeWidth={2}
                />
              ) : null
            }
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export const SINGLE_SERIES_CHART_CONFIGS = {
  heartRate: {
    label: "FC (lpm)",
    unit: "lpm",
    color: CLINICAL_CHART_COLORS.heartRate,
    domain: [
      CLINICAL_CHART_RANGES.heartRate.min,
      CLINICAL_CHART_RANGES.heartRate.max,
    ],
    normalRange: { y1: 60, y2: 100 },
    emptyMessage: "No hay datos de frecuencia cardíaca",
  },
  respiratoryRate: {
    label: "FR (rpm)",
    unit: "rpm",
    color: CLINICAL_CHART_COLORS.respiratoryRate,
    domain: [
      CLINICAL_CHART_RANGES.respiratoryRate.min,
      CLINICAL_CHART_RANGES.respiratoryRate.max,
    ],
    normalRange: { y1: 12, y2: 20 },
    emptyMessage: "No hay datos de frecuencia respiratoria",
  },
  oxygenSaturation: {
    label: "SpO₂ (%)",
    unit: "%",
    color: CLINICAL_CHART_COLORS.oxygenSaturation,
    domain: [
      CLINICAL_CHART_RANGES.oxygenSaturation.min,
      CLINICAL_CHART_RANGES.oxygenSaturation.max,
    ],
    normalRange: { y1: 95, y2: 100 },
    emptyMessage: "No hay datos de saturación de oxígeno",
  },
  bodyTemperature: {
    label: "Temp (°C)",
    unit: "°C",
    color: CLINICAL_CHART_COLORS.bodyTemperature,
    domain: [
      CLINICAL_CHART_RANGES.bodyTemperature.min,
      CLINICAL_CHART_RANGES.bodyTemperature.max,
    ],
    normalRange: { y1: 36.1, y2: 37.2 },
    emptyMessage: "No hay datos de temperatura corporal",
  },
  eva: {
    label: "EVA",
    unit: "",
    color: CLINICAL_CHART_COLORS.neutral,
    domain: [CLINICAL_CHART_RANGES.eva.min, CLINICAL_CHART_RANGES.eva.max],
    ticks: [0, 2, 4, 6, 8, 10],
    referenceZones: [
      { y1: 0, y2: 3, fill: CLINICAL_CHART_COLORS.painLow },
      { y1: 3, y2: 6, fill: CLINICAL_CHART_COLORS.painModerate },
      { y1: 6, y2: 10, fill: CLINICAL_CHART_COLORS.painHigh },
    ],
    tooltipValueFormatter: (v) => `Dolor: ${v} / 10`,
    emptyMessage: "No hay datos de EVA",
  },
} as const satisfies Record<string, Omit<SingleSeriesChartProps, "data">>;
