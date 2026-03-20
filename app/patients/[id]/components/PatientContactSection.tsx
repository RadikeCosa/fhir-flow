import React from "react";
import type { Patient } from "@/domain/patients/patient";
import { SectionCard } from "@/app/patients/components/SectionCard";
import {
  formatAddress,
  formatContactName,
  formatRelationship,
} from "@/lib/patient/formatters";

interface Props {
  patient: Patient;
  contacts?: Patient["contact"];
}

export const PatientContactSection: React.FC<Props> = ({
  patient,
  contacts,
}) => {
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

      {contacts && contacts.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">
            Contacto de emergencia
          </p>
          <ul className="space-y-2">
            {contacts.map((c, idx) => (
              <li key={idx} className="text-sm">
                <p>
                  <span className="font-medium">Nombre:</span>{" "}
                  {formatContactName(c.name)}
                </p>
                <p>
                  <span className="font-medium">Relación:</span>{" "}
                  {formatRelationship(c.relationship)}
                </p>
                <p>
                  <span className="font-medium">Teléfono:</span>{" "}
                  {c.phone || "No registrado"}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </SectionCard>
  );
};
