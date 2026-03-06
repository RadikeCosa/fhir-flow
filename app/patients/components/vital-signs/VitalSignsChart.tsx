"use client";

import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface LineConfig {
  dataKey: string;
  color: string;
  label: string;
}

interface Props {
  title: string;
  data: Array<Record<string, unknown>>;
  lines: LineConfig[];
}

export const VitalSignsChart: React.FC<Props> = ({ title, data, lines }) => {
  return (
    <div className="w-full">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">
        {title}
      </p>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            tickFormatter={(value: string) => {
              const parts = value.split("-");
              if (parts.length < 3) return value;
              return `${parts[2]}/${parts[1]}`;
            }}
          />
          <YAxis tick={{ fontSize: 11 }} width={36} />
          <Tooltip
            contentStyle={{ fontSize: 12 }}
            labelFormatter={(label: React.ReactNode) => {
              const str = typeof label === "string" ? label : "";
              const parts = str.split("-");
              if (parts.length < 3) return label;
              return `${parts[2]}/${parts[1]}/${parts[0]}`;
            }}
            formatter={(value: number | undefined) => [value ?? 0, title]}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {lines.map((line) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              stroke={line.color}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              name={line.label}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
