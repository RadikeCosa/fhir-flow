"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
  TooltipContentProps,
  ReferenceArea,
} from "recharts";

import {
  CLINICAL_CHART_COLORS,
  CLINICAL_CHART_RANGES,
  formatChartDate,
} from "../../../../../../lib/patient/formatters/encounter-charts.formatters";

interface BloodPressureChartProps {
  data: { date: string; systolic: number; diastolic: number }[];
}

// custom tooltip element used by the BP chart.  We intentionally pick
// systolic first regardless of payload order and style each line with a
// coloured dot matching the series colour.  The wrapper mimics other
// small cards in the app.
function CustomTooltip(props: TooltipContentProps<number, string>) {
  const { active, payload, label } = props;
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const systolicEntry = payload.find((p) => p.dataKey === "systolic");
  const diastolicEntry = payload.find((p) => p.dataKey === "diastolic");

  return (
    <div className="border border-border bg-surface rounded-md text-xs p-2">
      <div className="font-medium mb-1">{label}</div>
      {systolicEntry && (
        <div className="flex items-center">
          <span
            className="inline-block w-2 h-2 rounded-full mr-1"
            style={{ backgroundColor: CLINICAL_CHART_COLORS.systolic }}
          />
          <span>Sistólica: {systolicEntry.value} mmHg</span>
        </div>
      )}
      {diastolicEntry && (
        <div className="flex items-center">
          <span
            className="inline-block w-2 h-2 rounded-full mr-1"
            style={{ backgroundColor: CLINICAL_CHART_COLORS.diastolic }}
          />
          <span>Diastólica: {diastolicEntry.value} mmHg</span>
        </div>
      )}
    </div>
  );
}

export default function BloodPressureChart({ data }: BloodPressureChartProps) {
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

  // use fixed clinical range for both systolic and diastolic
  const domain: [number, number] = [
    CLINICAL_CHART_RANGES.bloodPressure.min,
    CLINICAL_CHART_RANGES.bloodPressure.max,
  ];

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tickFormatter={formatChartDate} />
        <YAxis domain={domain} />
        {/* normal systolic range, light opacity zone */}
        <ReferenceArea
          y1={90}
          y2={120}
          fill={CLINICAL_CHART_COLORS.normal}
          fillOpacity={0.08}
        />
        <Tooltip
          content={(props) =>
            CustomTooltip(props as TooltipContentProps<number, string>)
          }
          labelFormatter={(label) => formatChartDate(String(label))}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="systolic"
          name="Sistólica"
          stroke={CLINICAL_CHART_COLORS.systolic}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="diastolic"
          name="Diastólica"
          stroke={CLINICAL_CHART_COLORS.diastolic}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
