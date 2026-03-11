import Link from "next/link";
import { redirect } from "next/navigation";
import { createPatientRepository } from "../../../infrastructure/fhir/factories/patient.factory";
import { createEpisodeOfCareRepository } from "../../../infrastructure/fhir/factories/episode-of-care.factory";
import { createVitalSignRecordRepository } from "../../../infrastructure/fhir/factories/vital-sign-record.factory";
import { createAssessmentRepository } from "../../../infrastructure/fhir/factories/assessment.factory";
import { createEncounterRepository } from "../../../infrastructure/fhir/factories/encounter.factory";
import { currentPractitionerId } from "../../../config/fhir.config";
import { PatientPersonalSection } from "../components/detail/PatientPersonalSection";
import { PatientContactSection } from "../components/detail/PatientContactSection";
import { EpisodeOfCareSection } from "../components/detail/EpisodeOfCareSection";
import { LastEncounterSection } from "../components/detail/LastEncounterSection";
import { createProcedureRepository } from "../../../infrastructure/fhir/factories/procedure.factory";

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

  const patientRepo = createPatientRepository();
  const episodeRepo = createEpisodeOfCareRepository();
  const vitalRepo = createVitalSignRecordRepository();
  const assessmentRepo = createAssessmentRepository();

  const encounterRepo = createEncounterRepository();

  const [patient, episodes, lastEncounter, nextPlannedEncounter] =
    await Promise.all([
      patientRepo.findById(id),
      // fetch all episodes concurrently; page will render them if present
      episodeRepo.findAllByPatientId(id),
      encounterRepo.findLastByPatientIdAndPractitionerId(
        id,
        currentPractitionerId,
      ),
      encounterRepo.findNextPlannedByPatientIdAndPractitionerId(
        id,
        currentPractitionerId,
      ),
    ]);

  const procedureRepo = createProcedureRepository();

  const [
    lastEncounterProcedures,
    lastEncounterEvaRecords,
    lastEncounterVitalSigns,
  ] = lastEncounter
    ? await Promise.all([
        procedureRepo.findAllByEncounterId(lastEncounter.id),
        assessmentRepo.findEvaByEncounterId(lastEncounter.id),
        vitalRepo.findAllByEncounterId(lastEncounter.id),
      ])
    : [[], [], []];

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
    <>
      <div className="mb-4">
        <Link href="/patients" className="text-sm text-primary">
          ← Volver
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PatientPersonalSection
            patient={patient}
            practitioners={patient.generalPractitioner}
          />
          <PatientContactSection patient={patient} contacts={patient.contact} />
        </div>
        <EpisodeOfCareSection episodes={episodes} />
        <LastEncounterSection
          lastEncounter={lastEncounter}
          nextPlannedEncounter={nextPlannedEncounter}
          patientId={id}
          procedures={lastEncounterProcedures}
          evaRecords={lastEncounterEvaRecords}
          vitalSigns={lastEncounterVitalSigns}
        />
      </div>
    </>
  );
}
