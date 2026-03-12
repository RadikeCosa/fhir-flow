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

import { CLINICAL_CHART_COLORS, CLINICAL_CHART_RANGES } from "../../../../../../lib/patient/formatters/encounter-charts.formatters";

interface Datum {
  date: string;
  value: number;
}

interface EvaScoreChartProps {
  data: Datum[];
}

export default function EvaScoreChart({ data }: EvaScoreChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        role="status"
        className="flex items-center justify-center py-16 px-8 text-center text-sm text-muted"
      >
        No hay datos de EVA
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis
          domain={[
            CLINICAL_CHART_RANGES.eva.min,
            CLINICAL_CHART_RANGES.eva.max,
          ]}
          ticks={[0, 2, 4, 6, 8, 10]}
        />
        {/* clinical pain zones */}
        <ReferenceArea y1={0} y2={3} fill="#16a34a" fillOpacity={0.08} />
        <ReferenceArea y1={3} y2={6} fill="#d97706" fillOpacity={0.08} />
        <ReferenceArea y1={6} y2={10} fill="#dc2626" fillOpacity={0.08} />
        <Tooltip formatter={(v) => [`Dolor: ${v} / 10`, "EVA"]} />
        <Legend />
        <Line
          type="monotone"
          dataKey="value"
          name="EVA"
          stroke={CLINICAL_CHART_COLORS.neutral}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
