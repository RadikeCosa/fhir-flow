import Link from "next/link";
import { createEpisodeOfCareRepository } from "../../../../infrastructure/fhir/factories/episode-of-care.factory";
import { createEncounterRepository } from "../../../../infrastructure/fhir/factories/encounter.factory";
import { createVitalSignRecordRepository } from "../../../../infrastructure/fhir/factories/vital-sign-record.factory";
import { createAssessmentRepository } from "../../../../infrastructure/fhir/factories/assessment.factory";
import EmptyState from "../../components/EmptyState";
import EncounterList from "./components/EncounterList";
import EncounterVitalSignsSection from "./components/EncounterVitalSignsSection";
import EncounterEvaSection from "./components/EncounterEvaSection";
import type { EpisodeOfCare } from "../../../../domain/episode-of-care/episode-of-care";

type Props = {
  params: {
    id: string;
  };
};

export default async function Page({ params }: Props) {
  const patientId = params.id;

  const episodeRepo = createEpisodeOfCareRepository();
  const encounterRepo = createEncounterRepository();
  const vitalRepo = createVitalSignRecordRepository();
  const assessmentRepo = createAssessmentRepository();

  // fetch episode list to find the active one
  const episodes: EpisodeOfCare[] =
    await episodeRepo.findAllByPatientId(patientId);
  const activeEpisode = episodes.find((e) => e.status === "active");

  if (!activeEpisode) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <EmptyState />
      </div>
    );
  }

  const encounters = await encounterRepo.findAllByEpisodeOfCareId(
    activeEpisode.id,
  );

  // fetch vital signs and EVA assessments per encounter; this mirrors the
  // pattern used on the patient detail page and ensures we pick up records
  // that may be scoped to an encounter rather than directly to the patient.
  const [vitalArrays, evaArrays] = await Promise.all([
    Promise.all(encounters.map((e) => vitalRepo.findAllByEncounterId(e.id))),
    Promise.all(
      encounters.map((e) => assessmentRepo.findEvaByEncounterId(e.id)),
    ),
  ]);

  const vitalSigns = vitalArrays.flat();
  const evaRecords = evaArrays.flat();

  return (
    <>
      <div className="mb-4">
        <Link href={`/patients/${patientId}`} className="text-sm text-primary">
          ← Volver
        </Link>
      </div>

      <h1 className="text-2xl font-semibold mb-6">Historial de Encuentros</h1>

      <EncounterList encounters={encounters} />

      <div className="mt-8">
        <EncounterVitalSignsSection records={vitalSigns} />
      </div>

      <div className="mt-8">
        <EncounterEvaSection records={evaRecords} />
      </div>
    </>
  );
}
