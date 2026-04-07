import Breadcrumbs from "../../components/Breadcrumbs";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { PatientDetailData } from "./data";
import { PatientNotFoundError, getPatientDetailData } from "./data";
import { PatientPersonalSection } from "./components/PatientPersonalSection";
import { PatientContactSection } from "./components/PatientContactSection";
import { EpisodeOfCareSection } from "./components/EpisodeOfCareSection";
import { InitialEvaluationSection } from "./components/InitialEvaluationSection";
import { LastEncounterSection } from "./components/LastEncounterSection";
import ReAssessmentSection from "./components/ReAssessmentSection";
import { formatPatientName } from "@/lib/patient/formatters";
import { getEncounterRepresentativeStart } from "@/lib/patient/formatters/encounter.formatters";

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

  let data: PatientDetailData;
  try {
    data = await getPatientDetailData(id);
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

  const patientFullName = formatPatientName(data.patient.name);
  const hasActiveEpisode = data.episodes.some(
    (episode) => episode.status === "active",
  );
  const inProgressEncounter = data.inProgressEncounter;
  const nextPlannedEncounter = data.nextPlannedEncounter;
  const operationalStatus = !hasActiveEpisode
    ? "Sin episodio activo"
    : inProgressEncounter
      ? "Visita en curso"
      : nextPlannedEncounter
        ? "Próxima visita planificada"
        : null;

  const primaryAction = !hasActiveEpisode
    ? null
    : inProgressEncounter
      ? {
          label: "Completar visita",
          href: `/patients/${id}/encounters/${inProgressEncounter.id}`,
        }
      : nextPlannedEncounter
        ? {
            label: "Ver próxima visita",
            href: `/patients/${id}/encounters/${nextPlannedEncounter.id}`,
          }
        : {
            label: "Registrar visita",
            href: `/patients/${id}/encounters/register`,
          };

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Breadcrumbs patientName={patientFullName} />
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            {operationalStatus && <span>{operationalStatus}</span>}
            {data.patient.identifier && <span>DNI {data.patient.identifier}</span>}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <details className="rounded-md border border-border bg-surface px-3 py-2 text-xs text-foreground">
            <summary className="cursor-pointer list-none font-medium">
              Ver datos del paciente
            </summary>
            <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2 md:min-w-[40rem]">
              <PatientPersonalSection
                patient={data.patient}
                practitioners={data.patient.generalPractitioner}
              />
              <PatientContactSection
                patient={data.patient}
                contacts={data.patient.contact}
              />
            </div>
          </details>
          {primaryAction && (
            <Link
              href={primaryAction.href}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-hover transition-colors duration-150"
            >
              {primaryAction.label}
            </Link>
          )}
        </div>
      </div>
      <div className="mb-4">
        <Link href="/patients" className="text-sm text-primary">
          ← Volver
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <EpisodeOfCareSection episodes={data.episodes} patientId={id} />
        <LastEncounterSection
          lastEncounter={data.lastEncounter}
          nextPlannedEncounter={data.nextPlannedEncounter}
          patientId={id}
          procedures={data.lastEncounterProcedures}
          evaRecords={data.lastEncounterEvaRecords}
          vitalSigns={data.lastEncounterVitalSigns}
        />
      </div>
      <div className="mt-4 opacity-90">
        <InitialEvaluationSection
          encounterId={data.initialEncounter?.id ?? null}
          encounterDate={
            data.initialEncounter
              ? getEncounterRepresentativeStart(data.initialEncounter)
              : null
          }
          planOfCare={data.planOfCare}
          barthelAssessment={data.barthelAssessment}
          necpalAssessment={data.necpalAssessment}
          ecogAssessment={data.ecogAssessment}
        />
        <ReAssessmentSection
          entries={data.reAssessmentEntries}
          initialAssessments={
            data.barthelAssessment ? [data.barthelAssessment] : []
          }
        />
      </div>
    </>
  );
}
