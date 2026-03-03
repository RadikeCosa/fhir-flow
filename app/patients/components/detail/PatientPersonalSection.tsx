import React from "react";
import type { Patient } from "../../../../domain/patient";
import {
  computeAgeFromBirthDate,
  translateGenderToSpanish,
  formatMaritalStatus,
  formatDeceased,
} from "../../../../lib/patient/formatters";

interface Props {
  patient: Patient;
}

export const PatientPersonalSection: React.FC<Props> = ({ patient }) => {
  const fullName =
    `${patient.name.given || ""} ${patient.name.family || ""}`.trim() ||
    "Sin nombre";
  const birthDate = patient.birthDate || "No registrado";
  const age = computeAgeFromBirthDate(patient.birthDate);
  const gender = translateGenderToSpanish(patient.gender);
  const marital = formatMaritalStatus(patient.maritalStatus);
  const deceasedLabel = formatDeceased(patient.deceased);
  const statusLabel = deceasedLabel ?? (patient.active ? "Activo" : "Inactivo");

  return (
    <section className="p-4 bg-white rounded shadow mb-4">
      <h2 className="text-lg font-semibold mb-2">Información personal</h2>
      <p className="text-sm">
        <span className="font-medium">Nombre:</span> {fullName}
      </p>
      <p className="text-sm">
        <span className="font-medium">DNI:</span>{" "}
        {patient.identifier || "No registrado"}
      </p>
      <p className="text-sm">
        <span className="font-medium">Nacimiento:</span> {birthDate}
        {age && ` (${age})`}
      </p>
      <p className="text-sm">
        <span className="font-medium">Género:</span> {gender}
      </p>
      <p className="text-sm">
        <span className="font-medium">Estado civil:</span> {marital}
      </p>
      <p className="text-sm">
        <span className="font-medium">Estado:</span> {statusLabel}
      </p>
    </section>
  );
};
