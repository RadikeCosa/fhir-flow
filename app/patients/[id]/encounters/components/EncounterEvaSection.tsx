import { SectionCard } from "../../../components/SectionCard";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import type { EvaAssessment } from "../../../../../domain/assessments/eva-assessment";
import {
  getEvaBadge,
  getEvaTrend,
  getLatestEva,
} from "../../../../../lib/patient/formatters/assessments/eva-assessment.formatters";
import EvaThermometerCard from "./EvaThermometerCard";

interface Props {
  records: EvaAssessment[];
  summary?: boolean;
}

export default function EncounterEvaSection({
  records,
  summary = false,
}: Props) {
  if (!records || records.length === 0) {
    return (
      <SectionCard title="Dolor (EVA)">
        <p className="text-xs text-muted">Sin evaluaciones EVA</p>
      </SectionCard>
    );
  }

  if (summary) {
    const latest = getLatestEva(records);
    const badge = latest ? getEvaBadge(latest.score) : null;
    const trend = getEvaTrend(records);

    return (
      <SectionCard title="Dolor (EVA)">
        {latest ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-foreground">{latest.score}</span>
            {badge && (
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.colorClass}`}
              >
                {badge.label}
              </span>
            )}
            {trend !== "sin-datos" && (
              <span className="flex items-center gap-1 text-xs text-muted">
                {trend === "mejora" && (
                  <>
                    <TrendingDown size={14} className="text-success" />
                    mejora
                  </>
                )}
                {trend === "empeora" && (
                  <>
                    <TrendingUp size={14} className="text-error" />
                    empeora
                  </>
                )}
                {trend === "estable" && (
                  <>
                    <Minus size={14} className="text-muted" />
                    estable
                  </>
                )}
              </span>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted">Sin evaluaciones EVA</p>
        )}
      </SectionCard>
    );
  }

  // render one thermometer card per record, wrapping on small screens
  return (
    <SectionCard title="Dolor (EVA)">
      <div className="flex flex-wrap gap-2">
        {records.map((r, idx) => (
          <EvaThermometerCard key={idx} score={r.score} />
        ))}
      </div>
    </SectionCard>
  );
}
