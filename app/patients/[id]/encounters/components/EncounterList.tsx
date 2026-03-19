import type { Encounter } from "../../../../../domain/encounters/encounter";
import type { Procedure } from "../../../../../domain/procedures/procedure";
import type { VitalSignRecord } from "../../../../../domain/vital-sign-record/vital-sign-record";
import type { EvaAssessment } from "../../../../../domain/assessments/eva-assessment";
import type { BarthelAssessment } from "../../../../../domain/assessments/barthel-assessment";
import type { NecpalAssessment } from "../../../../../domain/assessments/necpal-assessment";
import type { EcogAssessment } from "../../../../../domain/assessments/ecog-assessment";
import EncounterCard from "./EncounterCard";

interface Props {
  encounters: Encounter[];
  proceduresByEncounterId: Record<string, Procedure[]>;
  vitalsByEncounterId: Record<string, VitalSignRecord[]>;
  evaByEncounterId: Record<string, EvaAssessment[]>;
  barthelByEncounterId: Record<string, BarthelAssessment | null>;
  necpalByEncounterId: Record<string, NecpalAssessment | null>;
  ecogByEncounterId: Record<string, EcogAssessment | null>;
}

export default function EncounterList({
  encounters,
  proceduresByEncounterId,
  vitalsByEncounterId,
  evaByEncounterId,
  barthelByEncounterId,
  necpalByEncounterId,
  ecogByEncounterId,
}: Props) {
  if (!encounters || encounters.length === 0) {
    return <p className="text-xs text-muted">No hay encuentros registrados</p>;
  }

  // split the list by status so we can render planned encounters first
  const planned = encounters.filter((e) => e.status === "planned");
  const others = encounters.filter((e) => e.status !== "planned");

  // Ensure we always sort planned encounters ascending (nearest first)
  const plannedSortedByStartAsc = [...planned].sort(
    (a, b) =>
      new Date(a.periodStart).getTime() - new Date(b.periodStart).getTime(),
  );

  // Ensure others are always sorted descending (most recent first)
  const othersSortedByStartDesc = [...others].sort(
    (a, b) =>
      new Date(b.periodStart).getTime() - new Date(a.periodStart).getTime(),
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
              barthelAssessment={barthelByEncounterId[enc.id] ?? null}
              necpalAssessment={necpalByEncounterId[enc.id] ?? null}
              ecogAssessment={ecogByEncounterId[enc.id] ?? null}
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
              barthelAssessment={
                barthelByEncounterId[plannedSortedByStartAsc[0].id] ?? null
              }
              necpalAssessment={
                necpalByEncounterId[plannedSortedByStartAsc[0].id] ?? null
              }
              ecogAssessment={
                ecogByEncounterId[plannedSortedByStartAsc[0].id] ?? null
              }
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

      {renderGroup("Sesiones anteriores", othersSortedByStartDesc)}
    </div>
  );
}
