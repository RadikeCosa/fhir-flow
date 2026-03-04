import React from "react";
import type { EpisodeOfCare } from "../../../../domain/episode-of-care";
import { SectionCard } from "./SectionCard";

interface Props {
  episodes: EpisodeOfCare[];
}

export const EpisodeOfCareSection: React.FC<Props> = ({ episodes }) => {
  if (episodes.length === 0) {
    return (
      <SectionCard title="Episodio de atención">
        <p className="text-xs text-muted italic">Sin episodio activo</p>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Episodio de atención">
      {episodes.map((episode) => (
        <dl
          key={episode.id}
          className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 mb-4 last:mb-0"
        >
          <dt className="text-xs text-muted font-medium">Identificador:</dt>
          <dd className="text-sm text-foreground">{episode.identifier}</dd>

          <dt className="text-xs text-muted font-medium">Estado:</dt>
          <dd className="text-sm text-foreground">{episode.status}</dd>

          <dt className="text-xs text-muted font-medium">Tipo:</dt>
          <dd className="text-sm text-foreground">{episode.type}</dd>

          <dt className="text-xs text-muted font-medium">Inicio:</dt>
          <dd className="text-sm text-foreground">{episode.startDate}</dd>

          <dt className="text-xs text-muted font-medium">Fin:</dt>
          <dd className="text-sm text-foreground">
            {episode.endDate ?? "En curso"}
          </dd>

          <dt className="text-xs text-muted font-medium">Diagnóstico:</dt>
          <dd className="text-sm text-foreground">
            {episode.condition.description}
          </dd>

          <dt className="text-xs text-muted font-medium">Código:</dt>
          <dd className="text-sm text-foreground">{episode.condition.code}</dd>

          <dt className="text-xs text-muted font-medium">Inicio síntomas:</dt>
          <dd className="text-sm text-foreground">
            {episode.condition.onsetDate ?? "No registrado"}
          </dd>

          <dt className="text-xs text-muted font-medium">Severidad:</dt>
          <dd className="text-sm text-foreground">
            {episode.condition.severity ?? "No registrada"}
          </dd>
        </dl>
      ))}
    </SectionCard>
  );
};
