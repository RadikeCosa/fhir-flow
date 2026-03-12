import type { Encounter } from "../../../../../domain/encounters/encounter";
import type { Procedure } from "../../../../../domain/procedures/procedure";
import EncounterCard from "./EncounterCard";

interface Props {
  encounters: Encounter[];
  proceduresByEncounterId: Record<string, Procedure[]>;
}

export default function EncounterList({
  encounters,
  proceduresByEncounterId,
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
        />
      ))}
    </div>
  );
}
