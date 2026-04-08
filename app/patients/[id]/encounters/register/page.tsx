import type { Metadata } from "next";
import Link from "next/link";
import { RegisterEncounterForm } from "../new/components/RegisterEncounterForm";
import { getNewEncounterPageData, type NewEncounterPageData } from "../new/data";
import { getRegisterEncounterContinuationData } from "./data";
import { mapInProgressEncounterDetailToFormInitialValues } from "@/lib/patient/mappers/in-progress-encounter-detail.mapper";

export const metadata: Metadata = {
  title: "Registrar visita | FHIR Flow",
  description: "Registra una visita del paciente con intención explícita",
};

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ encounterId?: string }>;
}

export default async function RegisterEncounterPage({
  params,
  searchParams,
}: PageProps) {
  const { id: patientId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const encounterId = resolvedSearchParams?.encounterId;

  const data: NewEncounterPageData = await getNewEncounterPageData(patientId);
  const { patientName, practitionerName, activeEpisodes } = data;

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
  const continuationData =
    typeof encounterId === "string" && encounterId.trim() !== ""
      ? await getRegisterEncounterContinuationData(patientId, encounterId)
      : null;

  const initialEncounterId = continuationData?.encounter?.id;
  const initialVisitType = continuationData?.encounter?.visitType;
  const initialActualStartAt = continuationData?.encounter?.actualStartAt;
  const initialValues = continuationData?.inProgressInitialValues
    ? mapInProgressEncounterDetailToFormInitialValues(
        continuationData.inProgressInitialValues,
      )
    : undefined;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Registrar visita</h1>
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
          <RegisterEncounterForm
            patientId={patientId}
            episodeOfCareId={activeEpisode.id}
            practitionerName={practitionerName}
            initialEncounterId={initialEncounterId}
            initialVisitType={initialVisitType}
            initialActualStartAt={initialActualStartAt}
            initialValues={initialValues}
          />
        </div>
      </div>
    </div>
  );
}
