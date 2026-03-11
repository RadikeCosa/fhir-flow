import type { Encounter } from "../../../../../domain/encounters/encounter";
import EncounterCard from "./EncounterCard";

interface Props {
  encounters: Encounter[];
}

export default function EncounterList({ encounters }: Props) {
  if (!encounters || encounters.length === 0) {
    return <p className="text-xs text-muted">No hay encuentros registrados</p>;
  }

  return (
    <div className="space-y-4">
      {encounters.map((enc) => (
        <EncounterCard key={enc.id} encounter={enc} />
      ))}
    </div>
  );
}
