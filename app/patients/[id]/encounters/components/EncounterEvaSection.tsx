import { SectionCard } from "../../../components/detail/SectionCard";
import type { EvaAssessment } from "../../../../../domain/assessments/eva-assessment";
import EvaThermometerCard from "./EvaThermometerCard";

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

  // render one thermometer card per record, wrapping on small screens
  return (
    <SectionCard title="EVA">
      <div className="flex flex-wrap gap-2">
        {records.map((r, idx) => (
          <EvaThermometerCard key={idx} score={r.score} />
        ))}
      </div>
    </SectionCard>
  );
}
