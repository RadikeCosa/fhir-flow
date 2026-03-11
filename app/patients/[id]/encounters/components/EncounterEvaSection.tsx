import { SectionCard } from "../../../components/detail/SectionCard";
import type { EvaAssessment } from "../../../../domain/assessments/eva-assessment";
import { formatEvaForChart } from "../../../../../lib/patient/formatters/encounter-charts.formatters";
import EvaScoreChart from "./charts/EvaScoreChart";

interface Props {
  records: EvaAssessment[];
}

export default function EncounterEvaSection({ records }: Props) {
  if (!records || records.length === 0) {
    return (
      <SectionCard title="EVA">
        <p className="text-xs text-muted">Sin evaluaciones EVA</p>
      </SectionCard>
    );
  }

  const chartData = formatEvaForChart(records);
  return (
    <SectionCard title="EVA">
      <EvaScoreChart data={chartData} />
    </SectionCard>
  );
}
