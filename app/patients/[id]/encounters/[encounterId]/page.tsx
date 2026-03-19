import Breadcrumbs from "../../../../components/Breadcrumbs";
import Link from "next/link";
import FinalizeEncounterForm from "./components/FinalizeEncounterForm";
import {
  createEncounterRepository,
  createPatientRepository,
} from "../../../../../infrastructure/fhir/factories";
import { getCurrentPractitioner } from "@/lib/server/current-practitioner";

type Props = {
  params: {
    id: string;
    encounterId: string;
  };
};

export default async function Page({ params }: Props) {
  const { id: patientId, encounterId } = params;

  const encounterRepo = createEncounterRepository();
  const patientRepo = createPatientRepository();

  const [encounter, patient, practitioner] = await Promise.all([
    encounterRepo.findById(encounterId),
    patientRepo.findById(patientId),
    getCurrentPractitioner(),
  ]);

  if (!encounter) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-lg w-full rounded-lg border border-border bg-surface p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">
            Encuentro no encontrado
          </h2>
          <p className="text-sm text-muted mb-4">
            No se ha encontrado el encuentro con ID {encounterId}.
          </p>
          <Link
            href={`/patients/${patientId}/encounters`}
            className="text-sm text-primary"
          >
            ← Volver a la lista de encuentros
          </Link>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-lg w-full rounded-lg border border-border bg-surface p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">Paciente no encontrado</h2>
          <p className="text-sm text-muted mb-4">
            No se ha encontrado el paciente con ID {patientId}.
          </p>
          <Link
            href={`/patients/${patientId}/encounters`}
            className="text-sm text-primary"
          >
            ← Volver a la lista de encuentros
          </Link>
        </div>
      </div>
    );
  }

  const editable =
    encounter.status === "planned" || encounter.status === "in-progress";
  const readOnly =
    encounter.status === "finished" || encounter.status === "cancelled";

  return (
    <div className="space-y-6">
      <Breadcrumbs
        patientName={`${patient.name.given} ${patient.name.family}`}
      />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Encuentro {encounter.id}</h1>
        <Link
          href={`/patients/${patientId}/encounters`}
          className="text-sm text-primary"
        >
          ← Volver a encuentros
        </Link>
      </div>

      {editable && (
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Estado: <strong>{encounter.status}</strong>
          </p>
          <FinalizeEncounterForm
            patientId={patientId}
            encounterId={encounterId}
            practitionerName={practitioner.displayName}
            periodStart={encounter.periodStart}
          />
        </div>
      )}

      {readOnly && (
        <div className="space-y-4">
          <p className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-700">
            Esta visita está finalizada y no puede editarse
          </p>

          <div className="border border-border rounded-lg bg-surface p-4">
            <dl className="grid grid-cols-1 gap-2 text-sm">
              <div>
                <dt className="font-medium">Estado</dt>
                <dd>{encounter.status}</dd>
              </div>
              <div>
                <dt className="font-medium">Tipo de visita</dt>
                <dd>{encounter.visitType}</dd>
              </div>
              <div>
                <dt className="font-medium">Inicio período</dt>
                <dd>{encounter.periodStart}</dd>
              </div>
              {encounter.periodEnd && (
                <div>
                  <dt className="font-medium">Fin período</dt>
                  <dd>{encounter.periodEnd}</dd>
                </div>
              )}
              {encounter.clinicalNote && (
                <div>
                  <dt className="font-medium">Nota clínica</dt>
                  <dd>{encounter.clinicalNote}</dd>
                </div>
              )}
              {encounter.reasonDisplay && (
                <div>
                  <dt className="font-medium">Razón</dt>
                  <dd>{encounter.reasonDisplay}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      )}

      {!editable && !readOnly && (
        <p className="text-sm text-muted">
          Estado de encuentro no reconocido: <strong>{encounter.status}</strong>
        </p>
      )}
    </div>
  );
}
