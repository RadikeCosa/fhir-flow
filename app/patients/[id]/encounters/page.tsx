import Link from "next/link";
import { notFound } from "next/navigation";
import { createPatientRepository } from "../../../../infrastructure/fhir/patient.factory";
import { createEpisodeOfCareRepository } from "../../../../infrastructure/fhir/episode-of-care.factory";
import { createEncounterRepository } from "../../../../infrastructure/fhir/factories/encounter.factory";
import { formatPatientName } from "../../../../lib/patient/formatters";
import type { Encounter } from "../../../../domain/encounter";
import EncounterList from "@/app/patients/components/encounters/EncounterList";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: Props) {
  const { id } = await params;

  // fetch patient and episodes in parallel; encounters depend on active ep
  const patientRepo = createPatientRepository();
  const episodeRepo = createEpisodeOfCareRepository();
  const encounterRepo = createEncounterRepository();

  const [patient, episodes] = await Promise.all([
    patientRepo.findById(id),
    episodeRepo.findAllByPatientId(id),
  ]);

  if (!patient) {
    notFound();
  }

  const activeEpisode = episodes.find((e) => e.status === "active") || null;
  if (!activeEpisode) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
        <h1 className="text-xl font-semibold mb-2">
          Visitas — {formatPatientName(patient?.name)}
        </h1>
        <p className="text-sm text-muted">
          No hay episodio activo para este paciente
        </p>
        <div className="mt-4">
          <Link href={`/patients/${id}`} className="text-sm text-primary">
            ← Volver al paciente
          </Link>
        </div>
      </div>
    );
  }

  const encounters: Encounter[] = await encounterRepo.findAllByEpisodeOfCareId(
    activeEpisode.id,
  );

  return (
    <>
      <div className="mb-4">
        <Link href={`/patients/${id}`} className="text-sm text-primary">
          ← Volver
        </Link>
      </div>

      <h1 className="text-xl font-semibold mb-4">
        Visitas — {formatPatientName(patient.name)}
      </h1>

      {encounters.length === 0 ? (
        <div className="text-sm text-muted italic">
          No hay visitas registradas en el episodio activo
        </div>
      ) : (
        <EncounterList encounters={encounters} patientId={id} />
      )}
    </>
  );
}
