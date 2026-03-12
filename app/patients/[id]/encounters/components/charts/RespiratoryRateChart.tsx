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
  ReferenceArea,
} from "recharts";

import {
  CLINICAL_CHART_COLORS,
  CLINICAL_CHART_RANGES,
  formatChartDate,
} from "../../../../../../lib/patient/formatters/encounter-charts.formatters";

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
        <XAxis dataKey="date" tickFormatter={formatChartDate} />
        <YAxis domain={domain} />
        {/* normal respiratory rate */}
        <ReferenceArea
          y1={12}
          y2={20}
          fill={CLINICAL_CHART_COLORS.normal}
          fillOpacity={0.08}
        />
        <Tooltip labelFormatter={(label) => formatChartDate(String(label))} />
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
