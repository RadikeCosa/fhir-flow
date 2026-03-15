import Breadcrumbs from "../../../components/Breadcrumbs";
import { createPatientRepository } from "../../../../infrastructure/fhir/factories/patient.factory";
import { createEpisodeOfCareRepository } from "../../../../infrastructure/fhir/factories/episode-of-care.factory";
import { createEncounterRepository } from "../../../../infrastructure/fhir/factories/encounter.factory";
import { createVitalSignRecordRepository } from "../../../../infrastructure/fhir/factories/vital-sign-record.factory";
import { createAssessmentRepository } from "../../../../infrastructure/fhir/factories/assessment.factory";
import { createProcedureRepository } from "../../../../infrastructure/fhir/factories/procedure.factory";
import { createBarthelAssessmentRepository } from "../../../../infrastructure/fhir/factories/barthel-assessment.factory";
import { createNecpalAssessmentRepository } from "../../../../infrastructure/fhir/factories/necpal-assessment.factory";
import { formatPatientName } from "@/lib/patient/formatters";
import EmptyState from "../../components/EmptyState";
import EncounterList from "./components/EncounterList";
import EpisodeChartsPanel from "./components/EpisodeChartsPanel";
import type { EpisodeOfCare } from "../../../../domain/episode-of-care/episode-of-care";
import type { Procedure } from "../../../../domain/procedures/procedure";
import type { VitalSignRecord } from "../../../../domain/vital-sign-record/vital-sign-record";
import type { EvaAssessment } from "../../../../domain/assessments/eva-assessment";
import type { BarthelAssessment } from "../../../../domain/assessments/barthel-assessment";
import type { NecpalAssessment } from "../../../../domain/assessments/necpal-assessment";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function Page({ params }: Props) {
  const { id: patientId } = await params;

  const patientRepo = createPatientRepository();
  const episodeRepo = createEpisodeOfCareRepository();
  const encounterRepo = createEncounterRepository();
  const vitalRepo = createVitalSignRecordRepository();
  const assessmentRepo = createAssessmentRepository();
  const procedureRepo = createProcedureRepository();
  const barthelRepo = createBarthelAssessmentRepository();
  const necpalRepo = createNecpalAssessmentRepository();

  const patient = await patientRepo.findById(patientId);

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

  // fetch vital signs, EVA, Barthel, NECPAL assessments and procedures per encounter in parallel
  const [vitalArrays, evaArrays, procedureArrays, barthelArrays, necpalArrays] =
    await Promise.all([
      Promise.all(encounters.map((e) => vitalRepo.findAllByEncounterId(e.id))),
      Promise.all(
        encounters.map((e) => assessmentRepo.findEvaByEncounterId(e.id)),
      ),
      Promise.all(
        encounters.map((e) => procedureRepo.findAllByEncounterId(e.id)),
      ),
      Promise.all(encounters.map((e) => barthelRepo.findByEncounterId(e.id))),
      Promise.all(encounters.map((e) => necpalRepo.findByEncounterId(e.id))),
    ]);

  // Longitudinal series for the episode charts panel
  const vitalSigns = vitalArrays.flat();
  const evaRecords = evaArrays.flat();

  // Per-encounter procedures map
  const proceduresByEncounterId: Record<string, Procedure[]> = {};
  // also build maps for vitals and assessments
  const vitalsByEncounterId: Record<string, VitalSignRecord[]> = {};
  const evaByEncounterId: Record<string, EvaAssessment[]> = {};
  const barthelByEncounterId: Record<string, BarthelAssessment | null> = {};
  const necpalByEncounterId: Record<string, NecpalAssessment | null> = {};

  encounters.forEach((enc, i) => {
    proceduresByEncounterId[enc.id] = procedureArrays[i];
    vitalsByEncounterId[enc.id] = vitalArrays[i];
    evaByEncounterId[enc.id] = evaArrays[i];
    barthelByEncounterId[enc.id] = barthelArrays[i];
    necpalByEncounterId[enc.id] = necpalArrays[i];
  });

  const fullName = patient ? formatPatientName(patient.name) : undefined;

  return (
    <>
      <Breadcrumbs patientName={fullName} />

      <h1 className="text-2xl font-semibold mb-6">Historial de Encuentros</h1>

      <div className="mb-8">
        <EpisodeChartsPanel vitalSigns={vitalSigns} evaRecords={evaRecords} />
      </div>

      <EncounterList
        encounters={encounters}
        proceduresByEncounterId={proceduresByEncounterId}
        vitalsByEncounterId={vitalsByEncounterId}
        evaByEncounterId={evaByEncounterId}
        barthelByEncounterId={barthelByEncounterId}
        necpalByEncounterId={necpalByEncounterId}
      />
    </>
  );
}
