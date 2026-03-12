"use client";

import { useState } from "react";
import { SectionCard } from "../../../components/detail/SectionCard";
import type { VitalSignRecord } from "../../../../../domain/vital-sign-record/vital-sign-record";
import type { EvaAssessment } from "../../../../../domain/assessments/eva-assessment";
import {
  formatVitalSignsForChart,
  formatEvaForChart,
} from "../../../../../lib/patient/formatters/encounter-charts.formatters";
import HeartRateChart from "./charts/HeartRateChart";
import RespiratoryRateChart from "./charts/RespiratoryRateChart";
import OxygenSaturationChart from "./charts/OxygenSaturationChart";
import BodyTemperatureChart from "./charts/BodyTemperatureChart";
import BloodPressureChart from "./charts/BloodPressureChart";
import EvaScoreChart from "./charts/EvaScoreChart";

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

  const chartData = formatVitalSignsForChart(vitalSigns);
  const evaData = formatEvaForChart(evaRecords);

  function renderChart() {
    switch (metric) {
      case "heart-rate":
        return <HeartRateChart data={chartData.heartRate} />;
      case "respiratory-rate":
        return <RespiratoryRateChart data={chartData.respiratoryRate} />;
      case "oxygen-saturation":
        return <OxygenSaturationChart data={chartData.oxygenSaturation} />;
      case "body-temperature":
        return <BodyTemperatureChart data={chartData.bodyTemperature} />;
      case "blood-pressure":
        return <BloodPressureChart data={chartData.bloodPressure} />;
      case "eva":
        return <EvaScoreChart data={evaData} />;
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
