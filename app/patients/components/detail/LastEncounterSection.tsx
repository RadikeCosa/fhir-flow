import React from "react";
import { SectionCard } from "./SectionCard";
import { formatDate } from "../../../../lib/patient/formatters";
import type { Encounter } from "../../../../domain/encounter";

interface Props {
  lastEncounter: Encounter | null;
  nextPlannedEncounter: Encounter | null;
  patientId: string;
}

// helper to translate the visitType value to a spanish label
function translateVisitType(type: Encounter["visitType"]): string {
  switch (type) {
    case "initial":
      return "Visita inicial";
    case "follow-up":
      return "Visita de seguimiento";
    case "discharge":
      return "Alta";
    default:
      return type;
  }
}

export const LastEncounterSection: React.FC<Props> = ({
  lastEncounter,
  nextPlannedEncounter,
  patientId,
}) => {
  // both empty -> render a simple empty message
  if (!lastEncounter && !nextPlannedEncounter) {
    return (
      <SectionCard title="Visitas">
        <div className="flex justify-between items-center mb-2">
          <h2 className="sr-only">Historial de visitas</h2>
          {patientId && (
            <a
              href={`/patients/${patientId}/encounters`}
              className="text-xs text-primary hover:underline"
            >
              Ver historial →
            </a>
          )}
        </div>
        <p className="text-xs text-muted italic">
          No hay visitas registradas aún
        </p>
      </SectionCard>
    );
  }

  // determine section title: prefer last if available
  const sectionTitle = lastEncounter
    ? "Mi última visita"
    : "Próxima visita planeada";

  const renderEncounter = (enc: Encounter, header: string) => (
    <div className="mb-4 last:mb-0" key={enc.id}>
      <h3 className="text-sm font-semibold text-foreground mb-1">{header}</h3>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        <dt className="text-xs text-muted font-medium">Fecha:</dt>
        <dd className="text-sm text-foreground">
          {formatDate(enc.periodStart) ?? ""}
        </dd>

        {enc.participant && (
          <>
            <dt className="text-xs text-muted font-medium">Profesional:</dt>
            <dd className="text-sm text-foreground">
              {enc.participant.practitionerName}{" "}
              {enc.participant.role && `(${enc.participant.role})`}
            </dd>
          </>
        )}

        <dt className="text-xs text-muted font-medium">Tipo de visita:</dt>
        <dd className="text-sm text-foreground">
          {translateVisitType(enc.visitType)}
        </dd>

        {typeof enc.durationMinutes === "number" && (
          <>
            <dt className="text-xs text-muted font-medium">Duración:</dt>
            <dd className="text-sm text-foreground">
              {enc.durationMinutes} min
            </dd>
          </>
        )}
      </dl>
    </div>
  );

  return (
    <SectionCard title={sectionTitle}>
      {/* optional link to full history in header area */}
      {patientId && (
        <div className="flex justify-end mb-2">
          <a
            href={`/patients/${patientId}/encounters`}
            className="text-xs text-primary hover:underline"
          >
            Ver historial →
          </a>
        </div>
      )}
      {/* render last first if present */}
      {lastEncounter && renderEncounter(lastEncounter, "Mi última visita")}
      {nextPlannedEncounter && (
        <>
          {/* add a small divider if both exist */}
          {lastEncounter && <hr className="my-2 border-border" />}
          {renderEncounter(nextPlannedEncounter, "Próxima visita planeada")}
        </>
      )}
    </SectionCard>
  );
};
