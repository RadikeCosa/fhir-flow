import Breadcrumbs from "../../components/Breadcrumbs";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { PatientDetailData } from "./data";
import { PatientNotFoundError, getPatientDetailData } from "./data";
import { PatientPersonalSection } from "../components/detail/PatientPersonalSection";
import { PatientContactSection } from "../components/detail/PatientContactSection";
import { EpisodeOfCareSection } from "../components/detail/EpisodeOfCareSection";
import { InitialEvaluationSection } from "../components/detail/InitialEvaluationSection";
import { LastEncounterSection } from "../components/detail/LastEncounterSection";
import ReAssessmentSection from "../components/detail/ReAssessmentSection";
import { formatPatientName } from "@/lib/patient/formatters";

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

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <Breadcrumbs patientName={patientFullName} />
        </div>
        {hasActiveEpisode &&
          (data.nextPlannedEncounter ? (
            <Link
              href={`/patients/${id}/encounters/${data.nextPlannedEncounter.id}`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-hover transition-colors duration-150"
            >
              Registrar Visita
            </Link>
          ) : (
            <Link
              href={`/patients/${id}/encounters/new`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-hover transition-colors duration-150"
            >
              Planificar Visita
            </Link>
          ))}
      </div>
      <div className="mb-4">
        <Link href="/patients" className="text-sm text-primary">
          ← Volver
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PatientPersonalSection
            patient={data.patient}
            practitioners={data.patient.generalPractitioner}
          />
          <PatientContactSection
            patient={data.patient}
            contacts={data.patient.contact}
          />
        </div>
        <EpisodeOfCareSection episodes={data.episodes} patientId={id} />
        <LastEncounterSection
          lastEncounter={data.lastEncounter}
          nextPlannedEncounter={data.nextPlannedEncounter}
          patientId={id}
          procedures={data.lastEncounterProcedures}
          evaRecords={data.lastEncounterEvaRecords}
          vitalSigns={data.lastEncounterVitalSigns}
        />
        <InitialEvaluationSection
          encounterId={data.initialEncounter?.id ?? null}
          encounterDate={data.initialEncounter?.periodStart ?? null}
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
