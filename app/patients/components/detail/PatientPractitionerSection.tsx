import React from "react";

interface Practitioner {
  id: string;
  display?: string;
}

interface Props {
  practitioners?: Practitioner[];
}

export const PatientPractitionerSection: React.FC<Props> = ({
  practitioners,
}) => {
  if (!Array.isArray(practitioners) || practitioners.length === 0) {
    return (
      <section className="p-4 bg-surface rounded shadow mb-4">
        <h2 className="text-lg font-semibold mb-2">Médico</h2>
        <p className="text-sm">Sin médico asignado</p>
      </section>
    );
  }

  return (
    <section className="p-4 bg-surface rounded shadow mb-4">
      <h2 className="text-lg font-semibold mb-2">Médico</h2>
      <ul className="space-y-1 text-sm">
        {practitioners.map((p) => (
          <li key={p.id}>{p.display ?? "Sin nombre"}</li>
        ))}
      </ul>
    </section>
  );
};
