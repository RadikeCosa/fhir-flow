"use client";

import type {
  ChartZone,
  EnrichedChartDatum,
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

import {
  CLINICAL_CHART_COLORS,
  CLINICAL_CHART_RANGES,
  formatChartDate,
} from "../../../../../../lib/patient/formatters/encounter-charts.formatters";

type BloodPressureChartDatum = EnrichedChartDatum & {
  systolic: number;
  diastolic: number;
};

interface BloodPressureChartProps {
  data: BloodPressureChartDatum[];
  zones?: ChartZone[];
}

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

export default function BloodPressureChart({
  data,
  zones,
}: BloodPressureChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        role="status"
        className="flex items-center justify-center py-16 px-8 text-center text-sm text-muted"
      >
        No hay datos de presión arterial
      </div>
    );
  }

  if (data.length === 1) {
    const point = data[0];
    const accentColor = point.zone?.color ?? getSeverityColor(point.severity);
    const badgeClass = getBadgeClass(point.severity);

    return (
      <div
        role="status"
        className="flex flex-col items-center justify-center gap-2 py-16 px-8 text-center border-l-4 border-border bg-surface rounded-md"
        style={{ borderLeftColor: accentColor }}
      >
        <div className="text-sm font-semibold">Presión arterial</div>
        <div
          className="flex items-baseline gap-2 text-3xl font-bold"
          style={{ color: accentColor }}
        >
          <span>{point.systolic}</span>
          <span>/</span>
          <span>{point.diastolic}</span>
          <span className="text-xl font-normal">mmHg</span>
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

  // use fixed clinical range for both systolic and diastolic
  const domain: [number, number] = [
    CLINICAL_CHART_RANGES.bloodPressure.min,
    CLINICAL_CHART_RANGES.bloodPressure.max,
  ];

  const lastIndex = data.length - 1;

  return (
    <div
      role="img"
      aria-label={`Gráfico de Tensión arterial (mmHg) — ${data.length} registros`}
      className="h-64"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tickFormatter={formatChartDate} />
          <YAxis domain={domain} />
          {zones?.map((zone, index) => (
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
              <ChartTooltip labelFormatter={formatChartDate} unit="mmHg" />
            }
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="chartValue"
            name="Sistólica"
            stroke={CLINICAL_CHART_COLORS.systolic}
            dot={({ cx, cy, index, payload }) =>
              index === lastIndex ? (
                <circle
                  key={`systolic-dot-${index}`}
                  cx={cx}
                  cy={cy}
                  r={4}
                  fill={
                    payload?.zone?.color ?? getSeverityColor(payload?.severity)
                  }
                  stroke="white"
                  strokeWidth={2}
                />
              ) : null
            }
          />
          <Line
            type="monotone"
            dataKey="diastolic"
            name="Diastólica"
            stroke={CLINICAL_CHART_COLORS.diastolic}
            dot={({ cx, cy, index }) =>
              index === lastIndex ? (
                <circle
                  key={`diastolic-dot-${index}`}
                  cx={cx}
                  cy={cy}
                  r={4}
                  fill={CLINICAL_CHART_COLORS.diastolic}
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
