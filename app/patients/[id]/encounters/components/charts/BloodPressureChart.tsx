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
import ChartTooltip from "./ChartTooltip";

import {
  CLINICAL_CHART_COLORS,
  CLINICAL_CHART_RANGES,
  formatChartDate,
} from "../../../../../../lib/patient/formatters/encounter-charts.formatters";

interface BloodPressureChartProps {
  data: { date: string; systolic: number; diastolic: number }[];
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
          content={
            <ChartTooltip labelFormatter={formatChartDate} unit="mmHg" />
          }
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
