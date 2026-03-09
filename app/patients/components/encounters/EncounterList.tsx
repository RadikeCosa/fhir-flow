import React from "react";
import type { Encounter } from "../../../../domain/encounters/encounter";
import EncounterCard from "./EncounterCard";

interface Props {
  encounters: Encounter[];
  patientId: string;
}

export default function EncounterList({ encounters, patientId }: Props) {
  if (!encounters || encounters.length === 0) {
    return (
      <p className="text-sm text-muted italic">
        No hay visitas registradas en el episodio activo
      </p>
    );
  }

  return (
    <div role="region" aria-label="Historial de visitas" className="space-y-3">
      {encounters.map((e) => (
        <EncounterCard key={e.id} encounter={e} patientId={patientId} />
      ))}
    </div>
  );
}
