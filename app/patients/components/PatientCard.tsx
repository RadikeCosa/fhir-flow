import type { Patient } from "../../../domain/patient";
import {
  computeAgeFromBirthDate,
  translateGenderToSpanish,
} from "../../../lib/patient/formatters";

/**
 * Presentational card for a single Patient domain model.
 *
 * Shows basic demographic and contact details. No business logic here.
 */
export default function PatientCard({ patient }: { patient: Patient }) {
  const fullName = `${patient.name.given}${patient.name.family ? " " + patient.name.family : ""}`;

  return (
    <div className="border rounded p-4 bg-white shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-medium">{fullName || "—"}</h3>
          <p className="text-sm text-gray-500">ID: {patient.identifier}</p>
        </div>
        <div className="text-sm text-gray-600 text-right">
          <div>
            {computeAgeFromBirthDate(patient.birthDate) ??
              patient.birthDate ??
              ""}
          </div>
          <div>{translateGenderToSpanish(patient.gender)}</div>
        </div>
      </div>

      <div className="mt-3 text-sm text-gray-700">
        {patient.phone && <div>Phone: {patient.phone}</div>}
        {patient.email && <div>Email: {patient.email}</div>}
      </div>
    </div>
  );
}
