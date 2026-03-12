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
        <ReferenceLine
          y={3}
          stroke={CLINICAL_CHART_COLORS.normal}
          strokeDasharray="3 3"
          strokeWidth={1}
          label={{
            position: "right",
            value: "Leve",
            fill: CLINICAL_CHART_COLORS.normal,
            fontSize: 10,
          }}
        />
        <ReferenceLine
          y={6}
          stroke={CLINICAL_CHART_COLORS.alert}
          strokeDasharray="3 3"
          strokeWidth={1}
          label={{
            position: "right",
            value: "Moderado",
            fill: CLINICAL_CHART_COLORS.alert,
            fontSize: 10,
          }}
        />
        <ReferenceLine
          y={9}
          stroke={CLINICAL_CHART_COLORS.critical}
          strokeDasharray="3 3"
          strokeWidth={1}
          label={{
            position: "right",
            value: "Severo",
            fill: CLINICAL_CHART_COLORS.critical,
            fontSize: 10,
          }}
        />
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
