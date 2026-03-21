"use client";

import type { TimeValueDatum } from "../../../../../../lib/patient/formatters/encounter-charts.formatters";
import type { VitalSignType } from "../../../../../../domain/vital-sign-record/vital-sign-record";
import {
  adaptClinicalRangesToChartReferences,
  CLINICAL_CHART_COLORS,
  CLINICAL_CHART_RANGES,
  formatChartDate,
} from "../../../../../../lib/patient/formatters/encounter-charts.formatters";
import {
  getClinicalStateAccentColor,
  getVitalSignSingleValuePresentation,
} from "../../../../../../lib/patient/formatters/vital-sign.formatters";
import { getEvaBadge } from "../../../../../../lib/patient/formatters/assessments/eva-assessment.formatters";
import {
  getClinicalRanges,
  getEvaClinicalRanges,
} from "../../../../../../lib/patient/formatters/clinical-ranges";
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

const HEART_RATE_CHART_REFERENCES = adaptClinicalRangesToChartReferences(
  getClinicalRanges("heart-rate"),
  { clampToDomain: CLINICAL_CHART_RANGES.heartRate },
);
const RESPIRATORY_RATE_CHART_REFERENCES = adaptClinicalRangesToChartReferences(
  getClinicalRanges("respiratory-rate"),
  { clampToDomain: CLINICAL_CHART_RANGES.respiratoryRate },
);
const OXYGEN_SATURATION_CHART_REFERENCES = adaptClinicalRangesToChartReferences(
  getClinicalRanges("oxygen-saturation"),
  { clampToDomain: CLINICAL_CHART_RANGES.oxygenSaturation },
);
const BODY_TEMPERATURE_CHART_REFERENCES = adaptClinicalRangesToChartReferences(
  getClinicalRanges("body-temperature"),
  { clampToDomain: CLINICAL_CHART_RANGES.bodyTemperature },
);
const EVA_CHART_REFERENCES = adaptClinicalRangesToChartReferences(
  getEvaClinicalRanges(),
  {
    includeNormalRange: false,
    includeNormalReferenceZones: true,
    clampToDomain: CLINICAL_CHART_RANGES.eva,
  },
);

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
  fallbackKind: "vital-sign" | "eva";
  vitalSignType?: VitalSignType;
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
  fallbackKind,
  vitalSignType,
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
    const evaBadge = getEvaBadge(point.value);
    const presentation =
      fallbackKind === "vital-sign" && vitalSignType
        ? getVitalSignSingleValuePresentation(vitalSignType, point.value)
        : {
            badge: evaBadge,
            accentColor: getClinicalStateAccentColor(evaBadge),
          };

    return (
      <div
        role="status"
        className="flex flex-col items-center justify-center gap-2 py-16 px-8 text-center border-l-4 border-border bg-surface rounded-md"
        style={{ borderLeftColor: presentation.accentColor }}
      >
        <div className="text-sm font-semibold">{label}</div>
        <div
          className="text-3xl font-bold"
          style={{ color: presentation.accentColor }}
        >
          {formattedValue}
        </div>
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${presentation.badge.colorClass}`}
        >
          {presentation.badge.label}
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
    fallbackKind: "vital-sign",
    vitalSignType: "heart-rate",
    domain: [
      CLINICAL_CHART_RANGES.heartRate.min,
      CLINICAL_CHART_RANGES.heartRate.max,
    ],
    ...HEART_RATE_CHART_REFERENCES,
    emptyMessage: "No hay datos de frecuencia cardíaca",
  },
  respiratoryRate: {
    label: "FR (rpm)",
    unit: "rpm",
    color: CLINICAL_CHART_COLORS.respiratoryRate,
    fallbackKind: "vital-sign",
    vitalSignType: "respiratory-rate",
    domain: [
      CLINICAL_CHART_RANGES.respiratoryRate.min,
      CLINICAL_CHART_RANGES.respiratoryRate.max,
    ],
    ...RESPIRATORY_RATE_CHART_REFERENCES,
    emptyMessage: "No hay datos de frecuencia respiratoria",
  },
  oxygenSaturation: {
    label: "SpO₂ (%)",
    unit: "%",
    color: CLINICAL_CHART_COLORS.oxygenSaturation,
    fallbackKind: "vital-sign",
    vitalSignType: "oxygen-saturation",
    domain: [
      CLINICAL_CHART_RANGES.oxygenSaturation.min,
      CLINICAL_CHART_RANGES.oxygenSaturation.max,
    ],
    ...OXYGEN_SATURATION_CHART_REFERENCES,
    emptyMessage: "No hay datos de saturación de oxígeno",
  },
  bodyTemperature: {
    label: "Temp (°C)",
    unit: "°C",
    color: CLINICAL_CHART_COLORS.bodyTemperature,
    fallbackKind: "vital-sign",
    vitalSignType: "body-temperature",
    domain: [
      CLINICAL_CHART_RANGES.bodyTemperature.min,
      CLINICAL_CHART_RANGES.bodyTemperature.max,
    ],
    ...BODY_TEMPERATURE_CHART_REFERENCES,
    emptyMessage: "No hay datos de temperatura corporal",
  },
  eva: {
    label: "EVA",
    unit: "",
    color: CLINICAL_CHART_COLORS.neutral,
    fallbackKind: "eva",
    domain: [CLINICAL_CHART_RANGES.eva.min, CLINICAL_CHART_RANGES.eva.max],
    ticks: [0, 2, 4, 6, 8, 10],
    referenceZones: EVA_CHART_REFERENCES.referenceZones,
    tooltipValueFormatter: (v) => `Dolor: ${v} / 10`,
    emptyMessage: "No hay datos de EVA",
  },
} as const satisfies Record<string, Omit<SingleSeriesChartProps, "data">>;
