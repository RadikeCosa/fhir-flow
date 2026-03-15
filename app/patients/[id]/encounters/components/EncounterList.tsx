import type { Encounter } from "../../../../../domain/encounters/encounter";
import type { Procedure } from "../../../../../domain/procedures/procedure";
import type { VitalSignRecord } from "../../../../../domain/vital-sign-record/vital-sign-record";
import type { EvaAssessment } from "../../../../../domain/assessments/eva-assessment";
import type { BarthelAssessment } from "../../../../../domain/assessments/barthel-assessment";
import type { NecpalAssessment } from "../../../../../domain/assessments/necpal-assessment";
import EncounterCard from "./EncounterCard";

interface Props {
  encounters: Encounter[];
  proceduresByEncounterId: Record<string, Procedure[]>;
  vitalsByEncounterId: Record<string, VitalSignRecord[]>;
  evaByEncounterId: Record<string, EvaAssessment[]>;
  barthelByEncounterId: Record<string, BarthelAssessment | null>;
  necpalByEncounterId: Record<string, NecpalAssessment | null>;
}

export default function EncounterList({
  encounters,
  proceduresByEncounterId,
  vitalsByEncounterId,
  evaByEncounterId,
  barthelByEncounterId,
  necpalByEncounterId,
}: Props) {
  if (!encounters || encounters.length === 0) {
    return <p className="text-xs text-muted">No hay encuentros registrados</p>;
  }

  // split the list by status so we can render planned encounters first
  const planned = encounters.filter((e) => e.status === "planned");
  const others = encounters.filter((e) => e.status !== "planned");

  const renderGroup = (title: string, list: Encounter[]) => {
    if (list.length === 0) return null;

    return (
      <>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <div className="space-y-3">
          {list.map((enc) => (
            <EncounterCard
              key={enc.id}
              encounter={enc}
              procedures={proceduresByEncounterId[enc.id] ?? []}
              vitalSigns={vitalsByEncounterId[enc.id] ?? []}
              evaRecords={evaByEncounterId[enc.id] ?? []}
              barthelAssessment={barthelByEncounterId[enc.id] ?? null}
              necpalAssessment={necpalByEncounterId[enc.id] ?? null}
            />
          ))}
        </div>
      </>
    );
  };

  return (
    <div className="space-y-8">
      {renderGroup("Próximas sesiones", planned)}
      {renderGroup("Sesiones anteriores", others)}
    </div>
  );
}
