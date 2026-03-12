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

interface OxygenSaturationChartProps {
  data: Datum[];
}

export default function OxygenSaturationChart({
  data,
}: OxygenSaturationChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        role="status"
        className="flex items-center justify-center py-16 px-8 text-center text-sm text-muted"
      >
        No hay datos de saturación de oxígeno
      </div>
    );
  }

  const domain: [number, number] = [
    CLINICAL_CHART_RANGES.oxygenSaturation.min,
    CLINICAL_CHART_RANGES.oxygenSaturation.max,
  ];

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis domain={domain} />
        {/* normal oxygen saturation range */}
        <ReferenceArea
          y1={95}
          y2={100}
          fill={CLINICAL_CHART_COLORS.normal}
          fillOpacity={0.08}
        />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="value"
          name="SpO₂ (%)"
          stroke={CLINICAL_CHART_COLORS.oxygenSaturation}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
