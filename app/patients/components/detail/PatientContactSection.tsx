import React from "react";
import type { Patient } from "../../../../domain/patient";
import { SectionCard } from "./SectionCard";
import { formatAddress } from "../../../../lib/patient/formatters";

interface Props {
  patient: Patient;
}

export const PatientContactSection: React.FC<Props> = ({ patient }) => {
  const phone = patient.phone || "No registrado";
  const email = patient.email || "No registrado";
  const address = formatAddress(patient.address);
  const mapsLink = address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : undefined;

  return (
    <SectionCard title="Contacto">
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        <dt className="text-xs text-muted font-medium">Teléfono:</dt>
        <dd className="text-sm text-foreground">{phone}</dd>

        <dt className="text-xs text-muted font-medium">Email:</dt>
        <dd className="text-sm text-foreground">{email}</dd>

        <dt className="text-xs text-muted font-medium">Dirección:</dt>
        <dd className="text-sm text-foreground">
          {address || "No registrada"}
          {mapsLink && (
            <a
              href={mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 text-primary underline text-xs"
            >
              Ver en Maps
            </a>
          )}
        </dd>
      </dl>
    </SectionCard>
  );
};
