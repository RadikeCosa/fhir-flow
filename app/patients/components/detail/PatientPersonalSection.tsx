import React from "react";
import type { Patient } from "../../../../domain/patient";
import { SectionCard } from "./SectionCard";
import {
  computeAgeFromBirthDate,
  translateGenderToSpanish,
  formatMaritalStatus,
  formatDeceased,
  formatPatientName,
} from "../../../../lib/patient/formatters";

interface Props {
  patient: Patient;
}

export const PatientPersonalSection: React.FC<Props> = ({ patient }) => {
  const fullName = formatPatientName(patient.name);
  const birthDate = patient.birthDate ?? "No registrado";
  const age = computeAgeFromBirthDate(patient.birthDate);
  const gender = translateGenderToSpanish(patient.gender);
  const marital = formatMaritalStatus(patient.maritalStatus);
  const deceasedLabel = formatDeceased(patient.deceased);
  const statusLabel = deceasedLabel ?? (patient.active ? "Activo" : "Inactivo");

  return (
    <SectionCard title="Información personal">
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        <dt className="text-xs text-muted font-medium">Nombre:</dt>
        <dd className="text-sm text-foreground">{fullName}</dd>

        <dt className="text-xs text-muted font-medium">DNI:</dt>
        <dd className="text-sm text-foreground">
          {patient.identifier || "No registrado"}
        </dd>

        <dt className="text-xs text-muted font-medium">Nacimiento:</dt>
        <dd className="text-sm text-foreground">
          {birthDate}
          {age && ` (${age})`}
        </dd>

        <dt className="text-xs text-muted font-medium">Género:</dt>
        <dd className="text-sm text-foreground">{gender}</dd>

        <dt className="text-xs text-muted font-medium">Estado civil:</dt>
        <dd className="text-sm text-foreground">{marital}</dd>

        <dt className="text-xs text-muted font-medium">Estado:</dt>
        <dd className="text-sm text-foreground">{statusLabel}</dd>
      </dl>
    </SectionCard>
  );
};
