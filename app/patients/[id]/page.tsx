import Link from "next/link";
import { redirect } from "next/navigation";
import { createPatientRepository } from "../../../infrastructure/fhir/patient.factory";
import { PatientPersonalSection } from "../components/detail/PatientPersonalSection";
import { PatientContactSection } from "../components/detail/PatientContactSection";
import { PatientEmergencyContactSection } from "../components/detail/PatientEmergencyContactSection";
import { PatientPractitionerSection } from "../components/detail/PatientPractitionerSection";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;
  if (!id) {
    // Redirect back to the list rather than rendering a confusing message.
    redirect("/patients");
  }

  const repo = createPatientRepository();
  const patient = await repo.findById(id);

  if (!patient) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-surface border border-border rounded-lg shadow-md p-6 text-center">
          <h2 className="text-base font-semibold text-foreground mb-2">
            Paciente no encontrado
          </h2>
          <p className="text-sm text-muted mb-4">
            No se encontró un paciente con el id proporcionado.
          </p>
          <Link href="/patients" className="text-sm text-primary">
            ← Volver
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      <div className="mb-4">
        <Link href="/patients" className="text-sm text-muted">
          ← Volver
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <PatientPersonalSection patient={patient} />
        <PatientContactSection patient={patient} />
        <PatientEmergencyContactSection contacts={patient.contact} />
        <PatientPractitionerSection
          practitioners={patient.generalPractitioner}
        />
      </div>
    </div>
  );
}
