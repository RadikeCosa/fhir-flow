import type { Patient } from "../../../domain/patient";
// TODO: patient.address not yet in domain model – address rendering
// is conditional below and safe if the field is absent.

/**
 * Presentational card for a single Patient domain model.
 *
 * Shows basic demographic and contact details. No business logic here.
 */
export default function PatientCard({ patient }: { patient: Patient }) {
  const fullName = `${patient.name.given}${patient.name.family ? " " + patient.name.family : ""}`;

  // build address string if available
  const addressDisplay = patient.address
    ? [
        ...(patient.address.line || []),
        patient.address.city,
        patient.address.country,
      ]
        .filter(Boolean)
        .join(", ")
    : "";

  return (
    <article
      aria-label={`Paciente: ${fullName || "—"}`}
      className="w-full bg-surface border border-border rounded-lg shadow-sm hover:shadow-md transition-all duration-150 p-4 md:p-5"
    >
      <div>
        <h3 className="text-base font-semibold text-foreground">
          {fullName || "—"}
        </h3>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-sm text-muted">
        {patient.phone && (
          <div className="flex items-center gap-1">Tel: {patient.phone}</div>
        )}
        {addressDisplay && (
          <div className="flex items-center gap-1">Dir: {addressDisplay}</div>
        )}
      </div>
    </article>
  );
}
