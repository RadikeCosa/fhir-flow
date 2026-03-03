import React from "react";
import type { Patient } from "../../../../domain/patient";
import { formatContactName } from "../../../../lib/patient/formatters";

interface Props {
  contacts?: Patient["contact"];
}

export const PatientEmergencyContactSection: React.FC<Props> = ({
  contacts,
}) => {
  if (!Array.isArray(contacts) || contacts.length === 0) {
    return (
      <section className="p-4 bg-surface rounded shadow mb-4">
        <h2 className="text-lg font-semibold mb-2">Contacto de emergencia</h2>
        <p className="text-sm">Sin contactos registrados</p>
      </section>
    );
  }

  return (
    <section className="p-4 bg-surface rounded shadow mb-4">
      <h2 className="text-lg font-semibold mb-2">Contacto de emergencia</h2>
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
    </section>
  );
};
