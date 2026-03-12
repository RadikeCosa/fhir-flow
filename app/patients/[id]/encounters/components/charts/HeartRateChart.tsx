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

import { CLINICAL_CHART_COLORS } from "../../../../../../lib/patient/formatters/encounter-charts.formatters";

import { CLINICAL_CHART_RANGES } from "../../../../../../lib/patient/formatters/encounter-charts.formatters";

interface Datum {
  date: string;
  value: number;
}

interface HeartRateChartProps {
  data: Datum[];
}

export default function HeartRateChart({ data }: HeartRateChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        role="status"
        className="flex items-center justify-center py-16 px-8 text-center text-sm text-muted"
      >
        No hay datos de frecuencia cardíaca
      </div>
    );
  }

  // fixed clinical display range
  const domain: [number, number] = [
    CLINICAL_CHART_RANGES.heartRate.min,
    CLINICAL_CHART_RANGES.heartRate.max,
  ];

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis domain={domain} />
        {/* normal heart rate range */}
        <ReferenceLine
          y={60}
          stroke={CLINICAL_CHART_COLORS.normal}
          strokeDasharray="3 3"
          strokeWidth={1}
        />
        <ReferenceLine
          y={100}
          stroke={CLINICAL_CHART_COLORS.normal}
          strokeDasharray="3 3"
          strokeWidth={1}
        />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="value"
          name="FC (lpm)"
          stroke={CLINICAL_CHART_COLORS.heartRate}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
