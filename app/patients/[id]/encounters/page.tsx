import Link from "next/link";
import { createEpisodeOfCareRepository } from "../../../../infrastructure/fhir/factories/episode-of-care.factory";
import { createEncounterRepository } from "../../../../infrastructure/fhir/factories/encounter.factory";
import { createVitalSignRecordRepository } from "../../../../infrastructure/fhir/factories/vital-sign-record.factory";
import { createAssessmentRepository } from "../../../../infrastructure/fhir/factories/assessment.factory";
import { createProcedureRepository } from "../../../../infrastructure/fhir/factories/procedure.factory";
import EmptyState from "../../components/EmptyState";
import EncounterList from "./components/EncounterList";
import EpisodeChartsPanel from "./components/EpisodeChartsPanel";
import type { EpisodeOfCare } from "../../../../domain/episode-of-care/episode-of-care";
import type { Procedure } from "../../../../domain/procedures/procedure";

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
  const procedureRepo = createProcedureRepository();

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

  const encountersRaw = await encounterRepo.findAllByEpisodeOfCareId(
    activeEpisode.id,
  );

  // Sort encounters newest first
  const encounters = [...encountersRaw].sort((a, b) =>
    a.periodStart < b.periodStart ? 1 : a.periodStart > b.periodStart ? -1 : 0,
  );

  // fetch vital signs, EVA assessments and procedures per encounter in parallel
  const [vitalArrays, evaArrays, procedureArrays] = await Promise.all([
    Promise.all(encounters.map((e) => vitalRepo.findAllByEncounterId(e.id))),
    Promise.all(
      encounters.map((e) => assessmentRepo.findEvaByEncounterId(e.id)),
    ),
    Promise.all(
      encounters.map((e) => procedureRepo.findAllByEncounterId(e.id)),
    ),
  ]);

  // Longitudinal series for the episode charts panel
  const vitalSigns = vitalArrays.flat();
  const evaRecords = evaArrays.flat();

  // Per-encounter procedures map
  const proceduresByEncounterId: Record<string, Procedure[]> = {};
  encounters.forEach((enc, i) => {
    proceduresByEncounterId[enc.id] = procedureArrays[i];
  });

  return (
    <>
      <div className="mb-4">
        <Link href={`/patients/${patientId}`} className="text-sm text-primary">
          ← Volver
        </Link>
      </div>

      <h1 className="text-2xl font-semibold mb-6">Historial de Encuentros</h1>

      <div className="mb-8">
        <EpisodeChartsPanel vitalSigns={vitalSigns} evaRecords={evaRecords} />
      </div>

      <EncounterList
        encounters={encounters}
        proceduresByEncounterId={proceduresByEncounterId}
      />
    </>
  );
}

