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
} from "recharts";

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

  // compute domain with a bit of padding around the min/max values
  const values = data.flatMap((d) => [d.systolic, d.diastolic]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = 10;
  const domain: [number, number] = [min - padding, max + padding];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis domain={domain} />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="systolic"
          name="Sistólica"
          stroke="#ff6b6b"
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="diastolic"
          name="Diastólica"
          stroke="#4c87d9"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
