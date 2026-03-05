import React from "react";
import { EpisodeOfCare } from "../../../../domain/episode-of-care";
import { SectionCard } from "./SectionCard";
import {
  formatDate,
  translateEpisodeStatus,
  getSeverityBadge,
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
        const severityBadge = getSeverityBadge(episode.condition.severity);
        const onset =
          formatDate(episode.condition.onsetDate) ?? "No registrado";
        const start = formatDate(episode.startDate) ?? episode.startDate;
        const end = episode.endDate ? formatDate(episode.endDate) : undefined;

        return (
          <dl
            key={episode.id}
            className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 mb-4 last:mb-0"
          >
            <dt className="text-xs text-muted font-medium">Estado:</dt>
            <dd>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.colorClass}`}
              >
                {statusBadge.label}
              </span>
            </dd>

            <dt className="text-xs text-muted font-medium">Tipo:</dt>
            <dd className="text-sm text-foreground">
              {formatEpisodeType(episode.type)}
            </dd>

            <dt className="text-xs text-muted font-medium">Inicio:</dt>
            <dd className="text-sm text-foreground">{start}</dd>

            {end && (
              <>
                <dt className="text-xs text-muted font-medium">Fin:</dt>
                <dd className="text-sm text-foreground">{end}</dd>
              </>
            )}

            <dt className="text-xs text-muted font-medium">Diagnóstico:</dt>
            <dd className="text-sm text-foreground flex flex-wrap items-center space-x-2">
              <span>{episode.condition.description}</span>

              {episode.condition.code && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {episode.condition.code}
                </span>
              )}

              {episode.condition.codeSystem && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-800">
                  {episode.condition.codeSystem}
                </span>
              )}
            </dd>

            <dt className="text-xs text-muted font-medium">Inicio síntomas:</dt>
            <dd className="text-sm text-foreground">{onset}</dd>

            <dt className="text-xs text-muted font-medium">Severidad:</dt>
            <dd>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${severityBadge.colorClass}`}
              >
                {severityBadge.label}
              </span>
            </dd>
          </dl>
        );
      })}
    </SectionCard>
  );
};
