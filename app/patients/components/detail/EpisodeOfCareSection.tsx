import React from "react";
import { EpisodeOfCare } from "../../../../domain/episode-of-care/episode-of-care";
import { SectionCard } from "./SectionCard";
import {
  formatDate,
  translateEpisodeStatus,
  formatEpisodeType,
} from "../../../../lib/patient/formatters";

interface Props {
  episodes: EpisodeOfCare[];
}

export const EpisodeOfCareSection: React.FC<Props> = ({ episodes }) => {
  if (episodes.length === 0) {
    return (
      <SectionCard title="Información del episodio">
        <p className="text-xs text-muted italic">Sin episodio activo</p>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Información del episodio">
      {episodes.map((episode) => {
        const statusBadge = translateEpisodeStatus(episode.status);
        const start = formatDate(episode.startDate) ?? episode.startDate;

        return (
          <div key={episode.id} className="mb-4 last:mb-0">
            {/* primary line: diagnosis description */}
            <p className="text-base font-medium text-foreground">
              {episode.condition.description}
            </p>

            {/* secondary line: start date + badges */}
            <div className="mt-1 flex flex-wrap items-center text-sm text-muted space-x-2">
              <span>{start}</span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.colorClass}`}
              >
                {statusBadge.label}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-border text-foreground">
                {formatEpisodeType(episode.type)}
              </span>
            </div>
          </div>
        );
      })}
    </SectionCard>
  );
};
