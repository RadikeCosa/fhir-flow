import type { Metadata } from "next";
import { CreateEncounterForm } from "./components/CreateEncounterForm";
import {
  createEpisodeOfCareRepository,
  createPatientRepository,
} from "../../../../../infrastructure/fhir/factories";
import type { EpisodeOfCare } from "../../../../../domain/episode-of-care/episode-of-care";
import { currentPractitionerName } from "../../../../../config/fhir.config";
import { formatPatientName } from "../../../../../lib/patient/formatters";

export const metadata: Metadata = {
  title: "Planificar Visita | FHIR Flow",
  description: "Crea una nueva visita planificada para el paciente",
};

/**
 * URL params for the Create Encounter page.
 *
 * @param params.id - Patient ID (from [id] dynamic segment)
 */
interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Server Component: Create Encounter page.
 *
 * Renders a form for creating a new planned Encounter for a patient.
 * The page is responsible for:
 *
 * 1. Extracting the patient ID from URL params
 * 2. Fetching all episodes of care for the patient
 * 3. Validating that exactly one episode is active
 *    - If 0 active: the patient has no active care plan; error
 *    - If 1 active: proceed (happy path)
 *    - If 2+ active: data integrity issue; error
 * 4. Passing patientId and episodeOfCareId to the Client Component (CreateEncounterForm)
 *
 * This is a Server Component (no "use client"). It fetches data server-side,
 * validates constraints, and only renders if valid. Errors are caught by error.tsx.
 */
export default async function CreateEncounterPage({ params }: PageProps) {
  // Extract patient ID from URL params
  const { id: patientId } = await params;

  // Resolve patient name and practitioner name in parallel.
  // These are used only for display; failures must not prevent the page from rendering.
  const patientNamePromise = (async () => {
    try {
      const patientRepo = createPatientRepository();
      const patient = await patientRepo.findById(patientId);

      return patient ? formatPatientName(patient.name) : "";
    } catch {
      return "";
    }
  })();

  const patientName = await patientNamePromise;
  const practitionerName = currentPractitionerName;

  // Fetch all episodes of care for this patient
  const episodeRepo = createEpisodeOfCareRepository();
  const episodes = await episodeRepo.findAllByPatientId(patientId);

  // Filter for active episodes only
  // (A patient may have completed episodes from previous hospitalizations)
  const activeEpisodes = episodes.filter(
    (e: EpisodeOfCare) => e.status === "active",
  );

  // Validate: must have exactly one active episode of care
  if (activeEpisodes.length === 0) {
    throw new Error(
      `No active episode of care found for patient ${patientId}. ` +
        "The patient must have an active care plan before planning a visit.",
    );
  }

  if (activeEpisodes.length > 1) {
    throw new Error(
      `Multiple active episodes found for patient ${patientId}. ` +
        "Data integrity issue: a patient should have at most one active episode at a time.",
    );
  }

  // Exactly one active episode: extract it
  const activeEpisode = activeEpisodes[0];

  // Render the create encounter form with patient and episode context
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Page header */}
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

      {/* Form card */}
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
