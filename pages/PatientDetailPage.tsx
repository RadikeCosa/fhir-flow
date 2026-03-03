import React, { useState, useEffect } from "react";
import type { Patient } from "../domain/patient";
import { createPatientRepository } from "../infrastructure/fhir/patient.factory";
import { PatientPersonalSection } from "../app/patients/components/detail/PatientPersonalSection";
import { PatientContactSection } from "../app/patients/components/detail/PatientContactSection";
import { PatientEmergencyContactSection } from "../app/patients/components/detail/PatientEmergencyContactSection";
import { PatientPractitionerSection } from "../app/patients/components/detail/PatientPractitionerSection";

interface Props {
  /** internal patient id coming from router params or props */
  id: string;
}

const repository = createPatientRepository();

export const PatientDetailPage: React.FC<Props> = ({ id }) => {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // reset state when the id parameter changes before the async fetch.
    setLoading(true);
    setError(null);

    repository
      .findById(id)
      .then((p) => setPatient(p))
      .catch(() => setError("Error cargando paciente"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="p-4">
        <p className="text-center">Cargando paciente…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <p className="text-center text-red-600">{error}</p>
      </div>
    );
  }

  if (patient === null) {
    return (
      <div className="p-4">
        <p className="text-center">Paciente no encontrado</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <PatientPersonalSection patient={patient} />
      <PatientContactSection patient={patient} />
      <PatientEmergencyContactSection contacts={patient.contact} />
      <PatientPractitionerSection practitioners={patient.generalPractitioner} />
    </div>
  );
};

export default PatientDetailPage;
