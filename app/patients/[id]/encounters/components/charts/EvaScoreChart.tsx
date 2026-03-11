"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

interface Datum {
  date: string;
  score: number;
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
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} />
        <Tooltip formatter={(value: any) => [`Dolor: ${value} / 10`, "EVA"]} />
        <Line type="monotone" dataKey="score" stroke="#dc2626" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
