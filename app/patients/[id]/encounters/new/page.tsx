import type { Metadata } from "next";
import Link from "next/link";
import { currentPractitionerId } from "@/config/fhir.config";
import type { EpisodeOfCare } from "@/domain/episode-of-care/episode-of-care";
import {
  createEpisodeOfCareRepository,
  createPatientRepository,
} from "@/infrastructure/fhir/factories";
import { formatPatientName } from "@/lib/patient/formatters";
import { getCurrentPractitioner } from "@/lib/server/current-practitioner";
import { CreateEncounterForm } from "./components/CreateEncounterForm";

export const metadata: Metadata = {
  title: "Planificar Visita | FHIR Flow",
  description: "Crea una nueva visita planificada para el paciente",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CreateEncounterPage({ params }: PageProps) {
  const { id: patientId } = await params;

  const patientNamePromise = (async () => {
    try {
      const patientRepo = createPatientRepository();
      const patient = await patientRepo.findById(patientId);

      return patient ? formatPatientName(patient.name) : "";
    } catch {
      return "";
    }
  })();

  const practitionerNamePromise = (async () => {
    try {
      const practitioner = await getCurrentPractitioner();
      return practitioner.displayName;
    } catch {
      return currentPractitionerId;
    }
  })();

  const [patientName, practitionerName] = await Promise.all([
    patientNamePromise,
    practitionerNamePromise,
  ]);

  const episodeRepo = createEpisodeOfCareRepository();
  const episodes = await episodeRepo.findAllByPatientId(patientId);

  const activeEpisodes = episodes.filter(
    (e: EpisodeOfCare) => e.status === "active",
  );

  if (activeEpisodes.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-surface border border-border rounded-lg shadow-md p-6 text-center">
          <h2 className="text-base font-semibold text-foreground mb-2">
            Sin plan de cuidado activo
          </h2>
          <p className="text-sm text-muted mb-4">
            El paciente no tiene un episodio de cuidado activo. Es necesario
            tener un plan de cuidado activo para planificar una visita.
          </p>
          <Link
            href={`/patients/${patientId}`}
            className="text-sm text-primary"
          >
            ← Volver
          </Link>
        </div>
      </div>
    );
  }

  if (activeEpisodes.length > 1) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-surface border border-border rounded-lg shadow-md p-6 text-center">
          <h2 className="text-base font-semibold text-foreground mb-2">
            Error de integridad de datos
          </h2>
          <p className="text-sm text-muted mb-4">
            Se detectó un problema: el paciente tiene múltiples planes de
            cuidado activos. Por favor, contacta al equipo de soporte.
          </p>
          <Link
            href={`/patients/${patientId}`}
            className="text-sm text-primary"
          >
            ← Volver
          </Link>
        </div>
      </div>
    );
  }

  const activeEpisode = activeEpisodes[0];

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          Planificar Nueva Visita
        </h1>
        <p className="mt-2 text-sm text-muted">
          Paciente: {patientName || patientId} | Episodio:{" "}
          <code className="text-xs bg-surface px-1 rounded">
            {activeEpisode.id}
          </code>
        </p>
      </div>

      <div className="bg-surface border border-border rounded-lg shadow-sm">
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Datos de la visita
          </h2>
        </div>
        <div className="p-6">
          <CreateEncounterForm
            patientId={patientId}
            episodeOfCareId={activeEpisode.id}
            practitionerName={practitionerName}
          />
        </div>
      </div>
    </div>
  );
}
