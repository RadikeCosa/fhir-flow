"use client";

import { useState, useMemo } from "react";
import { SectionCard } from "../../../components/SectionCard";
import type { VitalSignRecord } from "../../../../../domain/vital-sign-record/vital-sign-record";
import type { EvaAssessment } from "../../../../../domain/assessments/eva-assessment";
import {
  formatVitalSignsForChart,
  formatEvaForChart,
} from "../../../../../lib/patient/formatters/encounter-charts.formatters";
import {
  enrichChartData,
  toChartZones,
} from "../../../../../lib/patient/formatters/clinical-ranges.adapter";
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
  const heartRateData = useMemo(
    () => enrichChartData(chartData.heartRate, "heart-rate"),
    [chartData.heartRate],
  );
  const respiratoryRateData = useMemo(
    () => enrichChartData(chartData.respiratoryRate, "respiratory-rate"),
    [chartData.respiratoryRate],
  );
  const oxygenSaturationData = useMemo(
    () => enrichChartData(chartData.oxygenSaturation, "oxygen-saturation"),
    [chartData.oxygenSaturation],
  );
  const bodyTemperatureData = useMemo(
    () => enrichChartData(chartData.bodyTemperature, "body-temperature"),
    [chartData.bodyTemperature],
  );
  const bloodPressureData = useMemo(
    () =>
      chartData.bloodPressure.map((point) => {
        const [enriched] = enrichChartData(
          [{ date: point.date, value: point.systolic }],
          "blood-pressure",
        );

        return {
          ...point,
          ...enriched,
        };
      }),
    [chartData.bloodPressure],
  );
  const evaData = useMemo(
    () => enrichChartData(formatEvaForChart(evaRecords), "eva"),
    [evaRecords],
  );

  function renderChart() {
    switch (metric) {
      case "heart-rate":
        return (
          <SingleSeriesChart
            data={heartRateData}
            {...SINGLE_SERIES_CHART_CONFIGS.heartRate}
            zones={toChartZones("heart-rate")}
            showSubtleDots={heartRateData.length <= 5}
          />
        );
      case "respiratory-rate":
        return (
          <SingleSeriesChart
            data={respiratoryRateData}
            {...SINGLE_SERIES_CHART_CONFIGS.respiratoryRate}
            zones={toChartZones("respiratory-rate")}
            showSubtleDots={respiratoryRateData.length <= 5}
          />
        );
      case "oxygen-saturation":
        return (
          <SingleSeriesChart
            data={oxygenSaturationData}
            {...SINGLE_SERIES_CHART_CONFIGS.oxygenSaturation}
            zones={toChartZones("oxygen-saturation")}
            showSubtleDots={oxygenSaturationData.length <= 5}
          />
        );
      case "body-temperature":
        return (
          <SingleSeriesChart
            data={bodyTemperatureData}
            {...SINGLE_SERIES_CHART_CONFIGS.bodyTemperature}
            zones={toChartZones("body-temperature")}
            showSubtleDots={bodyTemperatureData.length <= 5}
          />
        );
      case "blood-pressure":
        return (
          <BloodPressureChart
            data={bloodPressureData}
            zones={toChartZones("blood-pressure")}
          />
        );
      case "eva":
        return (
          <SingleSeriesChart
            data={evaData}
            {...SINGLE_SERIES_CHART_CONFIGS.eva}
            zones={toChartZones("eva")}
            showSubtleDots={evaData.length <= 5}
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
