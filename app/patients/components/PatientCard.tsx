import Link from "next/link";
import { MapPin, Phone } from "lucide-react";
import type { Patient } from "../../../domain/patients/patient";

/**
 * Thrown when a patient cannot be rendered due to missing/invalid data.
 *
 * Placing this error in the same module keeps the component self-contained
 * for this small app; if additional domain errors arise we could relocate to
 * a shared `errors` module.
 */
export class PatientRenderError extends Error {
  patient: Patient;

  constructor(message: string, patient: Patient) {
    super(message);
    this.name = "PatientRenderError";
    this.patient = patient;
  }
}

/**
 * Presentational card for a single Patient domain model.
 *
 * Shows basic demographic and contact details. No business logic here.
 */
export default function PatientCard({ patient }: { patient: Patient }) {
  const fullName = `${patient.name.given}${patient.name.family ? " " + patient.name.family : ""}`;
  // guard against missing id which would lead to a broken link & confusing
  // navigation; this should never happen but the runtime check avoids
  // client-side errors when data is malformed.
  const hasValidId = typeof patient.id === "string" && patient.id.trim() !== "";

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

  if (!hasValidId) {
    // according to project rules we must not rely on console logging for
    // error handling. An invalid id at render time indicates a serious data
    // integrity problem that should surface as an exception so that higher
    // layers can decide how to react (error boundary, logging system, etc.).
    throw new PatientRenderError(
      "PatientCard rendered with invalid or empty id",
      patient,
    );
  }

  return (
    <Link href={`/patients/${patient.id}`}>
      <article
        aria-label={`Paciente: ${fullName || "—"}`}
        className="w-full bg-surface border border-border rounded-lg shadow-sm hover:shadow-md transition-all duration-150 p-4 md:p-5 cursor-pointer"
      >
        <div>
          <h3 className="text-base font-semibold text-foreground">
            {fullName || "—"}
          </h3>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-sm text-muted">
          {patient.phone && (
            <div className="flex items-center gap-1">
              <Phone size={14} aria-hidden="true" />
              {patient.phone}
            </div>
          )}
          {addressDisplay && (
            <div className="flex items-center gap-1">
              <MapPin size={14} aria-hidden="true" />
              {addressDisplay}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
