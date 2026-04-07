import Breadcrumbs from "../../components/Breadcrumbs";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { PatientDetailData } from "./data";
import { PatientNotFoundError, getPatientDetailData } from "./data";
import {
  formatAddress,
  formatContactName,
  formatPatientName,
  formatRelationship,
} from "@/lib/patient/formatters";
import { formatEncounterVisitType } from "@/lib/patient/formatters/encounter.formatters";

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
  const activeEpisode =
    data.episodes.find((episode) => episode.status === "active") ??
    data.episodes[0] ??
    null;
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

  const operationalSignal = [
    data.lastEncounter
      ? `Última visita: ${new Date(data.lastEncounter.periodStart).toLocaleDateString("es-AR")}`
      : "Última visita: sin registros",
    inProgressEncounter
      ? "Visita en curso: pendiente de finalización"
      : "Visita en curso: no",
    nextPlannedEncounter
      ? `Próxima visita: ${new Date(nextPlannedEncounter.periodStart).toLocaleDateString("es-AR")}`
      : "Próxima visita: no planificada",
  ];

  const emergencyContact = data.patient.contact?.[0];
  const relevantEncounter = inProgressEncounter ?? nextPlannedEncounter ?? data.lastEncounter;
  const relevantEncounterContext = relevantEncounter
    ? `Visita relevante: ${formatEncounterVisitType(relevantEncounter.visitType)} · ${new Date(
        relevantEncounter.periodStart,
      ).toLocaleDateString("es-AR")}`
    : "Visita relevante: sin contexto adicional";

  return (
    <>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <Breadcrumbs />
          <div className="flex items-center gap-2">
            {primaryAction && (
              <Link
                href={primaryAction.href}
                className="inline-flex items-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors duration-150 hover:bg-primary-hover"
              >
                {primaryAction.label}
              </Link>
            )}
          </div>
        </div>

        <section className="rounded-lg border border-border bg-surface p-4">
          <div className="space-y-3">
            <div>
              <h1 className="text-xl font-semibold text-foreground">{patientFullName}</h1>
              <p className="text-sm text-muted">DNI {data.patient.identifier || "No registrado"}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-foreground">
                {activeEpisode?.condition.description || "Sin diagnóstico registrado"}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {activeEpisode?.type?.map((type) => (
                  <span
                    key={type}
                    className="rounded-full bg-badge-info-bg px-2 py-0.5 text-xs font-medium text-badge-info-text"
                  >
                    {type}
                  </span>
                ))}
                {activeEpisode && (
                  <span className="rounded-full bg-badge-neutral-bg px-2 py-0.5 text-xs font-medium text-badge-neutral-text">
                    Episodio {activeEpisode.status}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-1 text-sm text-muted">
              {operationalStatus && <p>{operationalStatus}</p>}
              {operationalSignal.map((signal) => (
                <p key={signal}>{signal}</p>
              ))}
              <p>{relevantEncounterContext}</p>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <details className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-foreground">
                <summary className="cursor-pointer list-none text-sm font-medium">
                  Ver contacto
                </summary>
                <div className="mt-2 space-y-1 text-sm">
                  <p>Teléfono: {data.patient.phone || "No registrado"}</p>
                  <p>Contacto disponible: {data.patient.email || "No registrado"}</p>
                  <p>
                    Contacto de emergencia:{" "}
                    {emergencyContact
                      ? `${formatContactName(emergencyContact.name)} (${formatRelationship(
                          emergencyContact.relationship,
                        )}) - ${emergencyContact.phone || "No registrado"}`
                      : "No registrado"}
                  </p>
                  <p>Dirección: {formatAddress(data.patient.address) || "No registrada"}</p>
                </div>
              </details>
              <Link
                href={`/patients/${id}/encounters`}
                className="inline-flex items-center px-1 py-1 text-xs text-muted underline-offset-2 hover:underline"
              >
                Ver historial
              </Link>
            </div>
          </div>
        </section>

        <div>
          <Link href="/patients" className="text-sm text-primary">
            ← Volver
          </Link>
        </div>
      </div>
    </>
  );
}
