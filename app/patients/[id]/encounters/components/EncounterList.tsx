import type { Encounter } from "../../../../../domain/encounters/encounter";
import type { Procedure } from "../../../../../domain/procedures/procedure";
import type { VitalSignRecord } from "../../../../../domain/vital-sign-record/vital-sign-record";
import type { EvaAssessment } from "../../../../../domain/assessments/eva-assessment";
import { getEncounterRepresentativeStart } from "../../../../../lib/patient/formatters/encounter.formatters";
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

  // split by lifecycle bucket to keep rendering explicit and stable
  const planned = encounters.filter((e) => e.status === "planned");
  const inProgress = encounters.filter((e) => e.status === "in-progress");
  const finished = encounters.filter((e) => e.status === "finished");
  const cancelled = encounters.filter((e) => e.status === "cancelled");

  // Ensure we always sort planned encounters ascending (nearest first)
  const plannedSortedByStartAsc = [...planned].sort(
    (a, b) =>
      new Date(a.periodStart).getTime() - new Date(b.periodStart).getTime(),
  );

  const inProgressSortedByStartDesc = [...inProgress].sort(
    (a, b) =>
      new Date(getEncounterRepresentativeStart(b)).getTime() -
      new Date(getEncounterRepresentativeStart(a)).getTime(),
  );
  // Ensure historical sessions are always sorted descending (most recent first)
  const pastSessionsSortedByStartDesc = [...finished, ...cancelled].sort(
    (a, b) =>
      new Date(getEncounterRepresentativeStart(b)).getTime() -
      new Date(getEncounterRepresentativeStart(a)).getTime(),
  );

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
            />
          ))}
        </div>
      </>
    );
  };

  const upcomingCount = plannedSortedByStartAsc.length;
  const upcomingExtras = Math.max(0, upcomingCount - 1);

  return (
    <div className="space-y-8">
      {upcomingCount > 0 && (
        <>
          <h3 className="text-lg font-semibold text-foreground">
            Próximas sesiones
          </h3>
          <div className="space-y-3">
            <EncounterCard
              key={plannedSortedByStartAsc[0].id}
              encounter={plannedSortedByStartAsc[0]}
              procedures={
                proceduresByEncounterId[plannedSortedByStartAsc[0].id] ?? []
              }
              vitalSigns={
                vitalsByEncounterId[plannedSortedByStartAsc[0].id] ?? []
              }
              evaRecords={evaByEncounterId[plannedSortedByStartAsc[0].id] ?? []}
            />
          </div>
          {upcomingExtras > 0 && (
            <p className="text-xs text-muted">
              + {upcomingExtras} sesión{upcomingExtras === 1 ? "" : "es"} más
              programada{upcomingExtras === 1 ? "" : "s"}
            </p>
          )}
        </>
      )}

      {renderGroup("En curso", inProgressSortedByStartDesc)}
      {renderGroup("Sesiones anteriores", pastSessionsSortedByStartDesc)}
    </div>
  );
}
