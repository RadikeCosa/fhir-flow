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

  const values = data.map((d) => d.value);
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
          dataKey="value"
          name="FR (rpm)"
          stroke="#16a34a"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
