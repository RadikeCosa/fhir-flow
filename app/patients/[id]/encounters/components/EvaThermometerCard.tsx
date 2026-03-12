"use client";

import { CLINICAL_CHART_COLORS } from "../../../../../lib/patient/formatters/encounter-charts.formatters";
import { getEvaBadge } from "../../../../../lib/patient/formatters/assessments/eva-assessment.formatters";

interface Props {
  score: number; // expected 0-10
}

export default function EvaThermometerCard({ score }: Props) {
  // ensure external callers can't push the bar outside 0–100%
  const boundedScore = Math.max(0, Math.min(10, score));

  // determine fill color based on the scale zones (use bounded value)
  const fillColor =
    boundedScore <= 3
      ? CLINICAL_CHART_COLORS.normal
      : boundedScore <= 6
        ? CLINICAL_CHART_COLORS.alert
        : CLINICAL_CHART_COLORS.critical;

  const badge = getEvaBadge(boundedScore);

  return (
    <div className="bg-white rounded-lg shadow p-2 flex flex-row items-center gap-3">
      {/* left side: text information */}
      <div className="flex flex-col items-start">
        <span className="text-xs font-semibold text-muted">Dolor EVA</span>
        <span className="text-lg font-bold text-foreground">
          {boundedScore} / 10
        </span>
        <span
          className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.colorClass}`}
        >
          {badge.label}
        </span>
      </div>

      {/* right side: thermometer graphic */}
      <div className="relative w-5 rounded-full overflow-hidden h-20 bg-gray-100">
        {/* zone bands */}
        <div className="absolute w-full h-[30%] bg-red-200 top-0" />
        <div className="absolute w.full h-[30%] bg-yellow-200 top-[30%]" />
        <div className="absolute w-full h-[40%] bg-green-200 top-[60%]" />

        {/* fill bar */}
        <div
          className="absolute bottom-0 w-full rounded-full transition-all duration-500"
          style={{
            height: `${boundedScore * 10}%`,
            backgroundColor: fillColor,
          }}
        />
      </div>
    </div>
  );
}
