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

interface RespiratoryRateChartProps {
  data: Datum[];
}

export default function RespiratoryRateChart({
  data,
}: RespiratoryRateChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        role="status"
        className="flex items-center justify-center py-16 px-8 text-center text-sm text-muted"
      >
        No hay datos de frecuencia respiratoria
      </div>
    );
  }

  const domain: [number, number] = [
    CLINICAL_CHART_RANGES.respiratoryRate.min,
    CLINICAL_CHART_RANGES.respiratoryRate.max,
  ];

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis domain={domain} />
        {/* normal respiratory rate */}
        <ReferenceLine
          y={12}
          stroke={CLINICAL_CHART_COLORS.normal}
          strokeDasharray="3 3"
          strokeWidth={1}
        />
        <ReferenceLine
          y={20}
          stroke={CLINICAL_CHART_COLORS.normal}
          strokeDasharray="3 3"
          strokeWidth={1}
        />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="value"
          name="FR (rpm)"
          stroke={CLINICAL_CHART_COLORS.respiratoryRate}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
