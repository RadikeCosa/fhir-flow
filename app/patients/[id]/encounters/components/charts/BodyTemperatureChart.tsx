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
  ReferenceLine,
} from "recharts";

import { CLINICAL_CHART_COLORS, CLINICAL_CHART_RANGES } from "../../../../../../lib/patient/formatters/encounter-charts.formatters";

interface Datum {
  date: string;
  value: number;
}

interface BodyTemperatureChartProps {
  data: Datum[];
}

export default function BodyTemperatureChart({
  data,
}: BodyTemperatureChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        role="status"
        className="flex items-center justify-center py-16 px-8 text-center text-sm text-muted"
      >
        No hay datos de temperatura corporal
      </div>
    );
  }

  const domain: [number, number] = [
    CLINICAL_CHART_RANGES.bodyTemperature.min,
    CLINICAL_CHART_RANGES.bodyTemperature.max,
  ];

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis domain={domain} />
        {/* normal body temperature range */}
        <ReferenceLine
          y={36.1}
          stroke={CLINICAL_CHART_COLORS.normal}
          strokeDasharray="3 3"
          strokeWidth={1}
        />
        <ReferenceLine
          y={37.2}
          stroke={CLINICAL_CHART_COLORS.normal}
          strokeDasharray="3 3"
          strokeWidth={1}
        />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="value"
          name="Temp (°C)"
          stroke={CLINICAL_CHART_COLORS.bodyTemperature}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
