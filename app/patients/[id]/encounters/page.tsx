import Breadcrumbs from "../../../components/Breadcrumbs";
import Link from "next/link";
import { formatPatientName } from "@/lib/patient/formatters";
import EmptyState from "../../components/EmptyState";
import EncounterList from "./components/EncounterList";
import EpisodeChartsPanel from "./components/EpisodeChartsPanel";
import { PatientNotFoundError, getEncountersPageData } from "./data";
import type { EncountersPageData } from "./data";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function Page({ params }: Props) {
  const { id: patientId } = await params;

  let data: EncountersPageData;
  try {
    data = await getEncountersPageData(patientId);
  } catch (error) {
    if (error instanceof PatientNotFoundError) {
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

    throw error;
  }

  if (!data.activeEpisode) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <EmptyState />
      </div>
    );
  }

  const {
    patient,
    encounters,
    vitalSigns,
    evaRecords,
    proceduresByEncounterId,
    vitalsByEncounterId,
    evaByEncounterId,
    barthelByEncounterId,
    necpalByEncounterId,
    ecogByEncounterId,
  } = data;

  const fullName = formatPatientName(patient.name);

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
        ecogByEncounterId={ecogByEncounterId}
      />
    </>
  );
}
