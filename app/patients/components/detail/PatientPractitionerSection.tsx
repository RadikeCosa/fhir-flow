import React from "react";
import { SectionCard } from "./SectionCard";

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
  return (
    <SectionCard title="Médico">
      {!Array.isArray(practitioners) || practitioners.length === 0 ? (
        <p className="text-sm">Sin médico asignado</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {practitioners.map((p) => (
            <li key={p.id}>{p.display ?? "Sin nombre"}</li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
};
