"use client";

import {
  CLINICAL_CHART_COLORS,
  CLINICAL_CHART_RANGES,
  formatChartDate,
} from "../../../../../../lib/patient/formatters/encounter-charts.formatters";
import type {
  EnrichedChartDatum,
  ChartZone,
} from "../../../../../../lib/patient/formatters/clinical-ranges.adapter";
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

function getSeverityColor(severity?: ChartZone["severity"]): string {
  switch (severity) {
    case "normal":
      return CLINICAL_CHART_COLORS.normal;
    case "warning":
      return CLINICAL_CHART_COLORS.alert;
    case "critical":
      return CLINICAL_CHART_COLORS.critical;
    default:
      return CLINICAL_CHART_COLORS.neutral;
  }
}

function getBadgeClass(severity?: ChartZone["severity"]): string {
  switch (severity) {
    case "normal":
      return "bg-badge-success-bg text-badge-success-text";
    case "warning":
      return "bg-badge-warning-bg text-badge-warning-text";
    case "critical":
      return "bg-badge-error-bg text-badge-error-text";
    default:
      return "bg-badge-neutral-bg text-badge-neutral-text";
  }
}

export interface SingleSeriesChartProps {
  data: EnrichedChartDatum[];
  label: string;
  unit: string;
  color: string;
  domain: [number, number];
  zones?: ChartZone[];
  showSubtleDots?: boolean;
  zoneOpacity?: {
    normal?: number;
    warning?: number;
    critical?: number;
  };
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
  zones,
  showSubtleDots,
  zoneOpacity,
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
      ? tooltipValueFormatter(point.rawValue)
      : `${point.rawValue} ${unit}`;
    const badgeClass = getBadgeClass(point.severity);
    const accentColor = point.zone?.color ?? getSeverityColor(point.severity);

    return (
      <div
        role="status"
        className="flex flex-col items-center justify-center gap-2 py-16 px-8 text-center border-l-4 border-border bg-surface rounded-md"
        style={{ borderLeftColor: accentColor }}
      >
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-3xl font-bold" style={{ color: accentColor }}>
          {formattedValue}
        </div>
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}
        >
          {point.zone?.label ?? "Desconocido"}
        </span>
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
      className="h-64"
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
          {zones?.map((zone, index) => (
            <ReferenceArea
              key={index}
              y1={zone.y1}
              y2={zone.y2}
              fill={zone.fill}
              fillOpacity={zoneOpacity?.[zone.severity] ?? 0.08}
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
            dataKey="chartValue"
            name={label}
            stroke={color}
            dot={({ cx, cy, index, payload }) =>
              index === lastIndex ? (
                <circle
                  key={`dot-${index}`}
                  cx={cx}
                  cy={cy}
                  r={4}
                  fill={
                    payload?.zone?.color ?? getSeverityColor(payload?.severity)
                  }
                  stroke="white"
                  strokeWidth={2}
                />
              ) : showSubtleDots ? (
                <circle
                  key={`dot-${index}`}
                  cx={cx}
                  cy={cy}
                  r={2}
                  fill={
                    payload?.zone?.color ?? getSeverityColor(payload?.severity)
                  }
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
    emptyMessage: "No hay datos de temperatura corporal",
  },
  eva: {
    label: "EVA",
    unit: "",
    color: CLINICAL_CHART_COLORS.neutral,
    domain: [CLINICAL_CHART_RANGES.eva.min, CLINICAL_CHART_RANGES.eva.max],
    ticks: [0, 2, 4, 6, 8, 10],
    tooltipValueFormatter: (v) => `Dolor: ${v} / 10`,
    emptyMessage: "No hay datos de EVA",
  },
} as const satisfies Record<string, Omit<SingleSeriesChartProps, "data">>;
