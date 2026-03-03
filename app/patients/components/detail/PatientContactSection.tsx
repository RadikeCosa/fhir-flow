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
      <p className="text-sm">
        <span className="font-medium">Teléfono:</span> {phone}
      </p>
      <p className="text-sm">
        <span className="font-medium">Email:</span> {email}
      </p>
      <p className="text-sm">
        <span className="font-medium">Dirección:</span>{" "}
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
      </p>
    </SectionCard>
  );
};
