import Link from "next/link";
import type { Encounter } from "../../../../domain/encounters/encounter";
import { formatDate } from "../../../../lib/patient/formatters";

// Reuse error pattern from PatientCard for render-time data issues
export class EncounterRenderError extends Error {
  encounter: Encounter;
  constructor(message: string, encounter: Encounter) {
    super(message);
    this.name = "EncounterRenderError";
    this.encounter = encounter;
  }
}

interface Props {
  encounter: Encounter;
  patientId: string;
}

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

function statusBadge(status: Encounter["status"]) {
  switch (status) {
    case "planned":
      return { label: "Planificada", colorClass: "bg-gray-100 text-gray-800" };
    case "in-progress":
      return { label: "En curso", colorClass: "bg-primary/10 text-primary" };
    case "finished":
      return { label: "Finalizada", colorClass: "bg-success/10 text-success" };
    case "cancelled":
      return { label: "Cancelada", colorClass: "bg-error/10 text-error" };
    default:
      return {
        label: status || "Desconocido",
        colorClass: "bg-gray-100 text-gray-800",
      };
  }
}

export default function EncounterCard({ encounter, patientId }: Props) {
  // guard invalid id
  const hasValidId =
    typeof encounter.id === "string" && encounter.id.trim() !== "";
  if (!hasValidId) {
    throw new EncounterRenderError(
      "EncounterCard rendered with invalid or empty id",
      encounter,
    );
  }

  const badge = statusBadge(encounter.status);
  const practitionerDisplay = encounter.participant
    ? `${encounter.participant.practitionerName}${encounter.participant.role ? ` (${encounter.participant.role})` : ""}`
    : "Profesional no registrado";

  return (
    <Link
      href={`/patients/${patientId}/encounters/${encounter.id}`}
      className="block p-3 bg-surface border border-border rounded-lg hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium">
          {formatDate(encounter.periodStart) ?? ""}
        </span>
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.colorClass}`}
        >
          {badge.label}
        </span>
      </div>

      <div className="text-sm text-muted mb-1">
        {translateVisitType(encounter.visitType)}
      </div>

      <div className="text-sm text-foreground mb-1">{practitionerDisplay}</div>

      {typeof encounter.durationMinutes === "number" && (
        <div className="text-sm text-muted mb-1">
          {encounter.durationMinutes} min
        </div>
      )}

      {encounter.reasonDisplay && (
        <div className="text-xs text-muted">{encounter.reasonDisplay}</div>
      )}
    </Link>
  );
}
