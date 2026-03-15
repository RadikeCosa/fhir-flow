"use client";

import { useState, useMemo } from "react";
import { SectionCard } from "../../../components/detail/SectionCard";
import type { VitalSignRecord } from "../../../../../domain/vital-sign-record/vital-sign-record";
import type { EvaAssessment } from "../../../../../domain/assessments/eva-assessment";
import {
  formatVitalSignsForChart,
  formatEvaForChart,
} from "../../../../../lib/patient/formatters/encounter-charts.formatters";
import SingleSeriesChart, {
  SINGLE_SERIES_CHART_CONFIGS,
} from "./charts/SingleSeriesChart";
import BloodPressureChart from "./charts/BloodPressureChart";

type MetricKey =
  | "heart-rate"
  | "respiratory-rate"
  | "oxygen-saturation"
  | "body-temperature"
  | "blood-pressure"
  | "eva";

const METRIC_OPTIONS: { value: MetricKey; label: string }[] = [
  { value: "heart-rate", label: "Frecuencia cardíaca" },
  { value: "respiratory-rate", label: "Frecuencia respiratoria" },
  { value: "oxygen-saturation", label: "Saturación de oxígeno" },
  { value: "body-temperature", label: "Temperatura corporal" },
  { value: "blood-pressure", label: "Presión arterial" },
  { value: "eva", label: "EVA (dolor)" },
];

interface Props {
  vitalSigns: VitalSignRecord[];
  evaRecords: EvaAssessment[];
}

export default function EpisodeChartsPanel({ vitalSigns, evaRecords }: Props) {
  const [metric, setMetric] = useState<MetricKey>("heart-rate");

  const chartData = useMemo(
    () => formatVitalSignsForChart(vitalSigns),
    [vitalSigns],
  );
  const evaData = useMemo(() => formatEvaForChart(evaRecords), [evaRecords]);

  function renderChart() {
    switch (metric) {
      case "heart-rate":
        return (
          <SingleSeriesChart
            data={chartData.heartRate}
            {...SINGLE_SERIES_CHART_CONFIGS.heartRate}
          />
        );
      case "respiratory-rate":
        return (
          <SingleSeriesChart
            data={chartData.respiratoryRate}
            {...SINGLE_SERIES_CHART_CONFIGS.respiratoryRate}
          />
        );
      case "oxygen-saturation":
        return (
          <SingleSeriesChart
            data={chartData.oxygenSaturation}
            {...SINGLE_SERIES_CHART_CONFIGS.oxygenSaturation}
          />
        );
      case "body-temperature":
        return (
          <SingleSeriesChart
            data={chartData.bodyTemperature}
            {...SINGLE_SERIES_CHART_CONFIGS.bodyTemperature}
          />
        );
      case "blood-pressure":
        return <BloodPressureChart data={chartData.bloodPressure} />;
      case "eva":
        return (
          <SingleSeriesChart
            data={evaData}
            {...SINGLE_SERIES_CHART_CONFIGS.eva}
          />
        );
    }
  }

  return (
    <SectionCard title="Evolución del episodio activo">
      <div className="mb-4">
        <select
          value={metric}
          onChange={(e) => setMetric(e.target.value as MetricKey)}
          className="text-sm border border-border rounded-md px-3 py-1.5 bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          {METRIC_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      {renderChart()}
    </SectionCard>
  );
}
