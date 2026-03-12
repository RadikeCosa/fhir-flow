import type { Encounter } from "../../../../../domain/encounters/encounter";
import type { Procedure } from "../../../../../domain/procedures/procedure";
import type { VitalSignRecord } from "../../../../../domain/vital-sign-record/vital-sign-record";
import type { EvaAssessment } from "../../../../../domain/assessments/eva-assessment";
import EncounterCard from "./EncounterCard";

interface Props {
  encounters: Encounter[];
  proceduresByEncounterId: Record<string, Procedure[]>;
  vitalsByEncounterId: Record<string, VitalSignRecord[]>;
  evaByEncounterId: Record<string, EvaAssessment[]>;
}

export default function EncounterList({
  encounters,
  proceduresByEncounterId,
  vitalsByEncounterId,
  evaByEncounterId,
}: Props) {
  if (!encounters || encounters.length === 0) {
    return <p className="text-xs text-muted">No hay encuentros registrados</p>;
  }

  return (
    <div className="space-y-4">
      {encounters.map((enc) => (
        <EncounterCard
          key={enc.id}
          encounter={enc}
          procedures={proceduresByEncounterId[enc.id] ?? []}
          vitalSigns={vitalsByEncounterId[enc.id] ?? []}
          evaRecords={evaByEncounterId[enc.id] ?? []}
        />
      ))}
    </div>
  );
}
