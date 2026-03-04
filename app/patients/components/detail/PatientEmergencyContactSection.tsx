import React from "react";
import type { Patient } from "../../../../domain/patient";
import { SectionCard } from "./SectionCard";
import { formatContactName } from "../../../../lib/patient/formatters";

interface Props {
  contacts?: Patient["contact"];
}

export const PatientEmergencyContactSection: React.FC<Props> = ({
  contacts,
}) => {
  return (
    <SectionCard title="Contacto de emergencia">
      {!Array.isArray(contacts) || contacts.length === 0 ? (
        <p className="text-xs text-muted italic">Sin registros</p>
      ) : (
        <ul className="space-y-2">
          {contacts.map((c, idx) => (
            <li key={idx} className="text-sm">
              <p>
                <span className="font-medium">Nombre:</span>{" "}
                {formatContactName(c.name)}
              </p>
              <p>
                <span className="font-medium">Relación:</span>{" "}
                {c.relationship || "No registrada"}
              </p>
              <p>
                <span className="font-medium">Teléfono:</span>{" "}
                {c.phone || "No registrado"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
};
