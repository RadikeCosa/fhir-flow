import React from "react";
import { EpisodeOfCare } from "@/domain/episode-of-care/episode-of-care";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SectionCard } from "@/app/patients/components/SectionCard";
import {
  translateEpisodeStatus,
  formatEpisodeType,
  getSeverityBadge,
  formatReferralLine,
  formatEpisodeStartLabel,
} from "@/lib/patient/formatters";

interface Props {
  episodes: EpisodeOfCare[];
  patientId: string;
}

export const EpisodeOfCareSection: React.FC<Props> = ({
  episodes,
  patientId,
}) => {
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
        const typeLabel = formatEpisodeType(episode.type);
        const startLabel = formatEpisodeStartLabel(
          episode.startDate,
          episode.status,
        );

        const hasReferral = !!episode.referral;
        const hasCoverage = !!episode.coverage;

        return (
          <div key={episode.id} className="mb-4 last:mb-0">
            <div>
              <p className="text-base font-medium text-foreground">
                {episode.condition.description}
              </p>
              {episode.condition.bodySite && (
                <p className="text-sm text-muted mt-1">
                  {episode.condition.bodySite}
                </p>
              )}

              <div className="mt-2 flex items-center flex-wrap gap-2">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${severityBadge.colorClass}`}
                >
                  {severityBadge.label}
                </span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.colorClass}`}
                >
                  {statusBadge.label}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-border text-foreground">
                  {typeLabel}
                </span>
                <span className="text-sm text-muted">{startLabel}</span>
              </div>
            </div>

            {(hasReferral || hasCoverage || episode.referral?.requestNote) && (
              <details className="mt-3 pt-3 border-t border-border">
                <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-muted">
                  Ver información administrativa del episodio
                </summary>
                {(hasReferral || hasCoverage) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                    {hasReferral && (
                      <div className={hasCoverage ? "" : "col-span-2"}>
                        <div className="text-xs font-semibold uppercase tracking-wide text-muted">
                          Pedido de atención
                        </div>
                        <div className="mt-1 text-sm text-foreground">
                          {formatReferralLine(episode.referral)}
                        </div>
                        {episode.referral?.reasonText && (
                          <div className="mt-1 text-sm text-muted">
                            {episode.referral.reasonText}
                          </div>
                        )}
                      </div>
                    )}
                    {hasCoverage && (
                      <div className={hasReferral ? "" : "col-span-2"}>
                        <div className="text-xs font-semibold uppercase tracking-wide text-muted">
                          Cobertura
                        </div>
                        <div className="mt-1 text-sm text-foreground">
                          {episode.coverage?.payorName}
                        </div>
                        {episode.coverage?.planName && (
                          <div className="mt-1 text-xs text-muted">
                            {episode.coverage.planName}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {episode.referral?.requestNote && (
                  <div className="mt-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted">
                      Indicaciones
                    </div>
                    <div className="border-l-2 border-primary pl-3 mt-1 text-sm text-muted italic">
                      {episode.referral.requestNote}
                    </div>
                  </div>
                )}
              </details>
            )}
          </div>
        );
      })}

      <div className="mt-3 pt-3 border-t border-border">
        <Link
          href={`/patients/${patientId}/encounters`}
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          Ver historial de encuentros
          <ChevronRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </SectionCard>
  );
};
