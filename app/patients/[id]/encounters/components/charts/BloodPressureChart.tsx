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

  if (data.length === 1) {
    const point = data[0];

    return (
      <div
        role="status"
        className="flex flex-col items-center justify-center py-16 px-8 text-center"
      >
        <div className="text-sm font-semibold">Presión arterial</div>
        <div className="flex items-baseline gap-2 text-3xl font-bold">
          <span style={{ color: CLINICAL_CHART_COLORS.systolic }}>
            {point.systolic}
          </span>
          <span style={{ color: CLINICAL_CHART_COLORS.diastolic }}>
            {point.diastolic}
          </span>
          <span className="text-xl font-normal">mmHg</span>
        </div>
        <div className="text-sm text-muted">{formatChartDate(point.date)}</div>
        <div className="text-sm text-muted mt-2">
          Solo hay un registro disponible
        </div>
      </div>
    );
  }

  // use fixed clinical range for both systolic and diastolic
  const domain: [number, number] = [
    CLINICAL_CHART_RANGES.bloodPressure.min,
    CLINICAL_CHART_RANGES.bloodPressure.max,
  ];

  const lastIndex = data.length - 1;

  return (
    <div
      role="img"
      aria-label={`Gráfico de Tensión arterial (mmHg) — ${data.length} registros`}
      className="h-35 md:h-45 lg:h-55"
    >
      <ResponsiveContainer width="100%" height="100%">
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
            cursor={{ strokeDasharray: "3 3" }}
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
            dot={({ cx, cy, index }) =>
              index === lastIndex ? (
                <circle
                  key={`systolic-dot-${index}`}
                  cx={cx}
                  cy={cy}
                  r={4}
                  fill={CLINICAL_CHART_COLORS.systolic}
                  stroke="white"
                  strokeWidth={2}
                />
              ) : null
            }
          />
          <Line
            type="monotone"
            dataKey="diastolic"
            name="Diastólica"
            stroke={CLINICAL_CHART_COLORS.diastolic}
            dot={({ cx, cy, index }) =>
              index === lastIndex ? (
                <circle
                  key={`diastolic-dot-${index}`}
                  cx={cx}
                  cy={cy}
                  r={4}
                  fill={CLINICAL_CHART_COLORS.diastolic}
                  stroke="white"
                  strokeWidth={2}
                />
              ) : null
            }
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
