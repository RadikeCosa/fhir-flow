import Link from "next/link";
import Breadcrumbs from "../../../../components/Breadcrumbs";
import FinalizeEncounterForm from "./components/FinalizeEncounterForm";
import PlannedFinalizeEncounterSection from "./components/PlannedFinalizeEncounterSection";
import { getEncounterDetailData, type EncounterDetailData } from "./data";
import {
  formatDateTime,
  formatPatientName,
  formatPlannedSchedule,
} from "@/lib/patient/formatters";
import {
  formatEncounterVisitType,
  formatEncounterDuration,
  getEncounterRepresentativeEnd,
  getEncounterRepresentativeStart,
  getEncounterStatusBadge,
} from "@/lib/patient/formatters/encounter.formatters";
import EncounterClinicalNote from "../components/EncounterClinicalNote";
import EncounterVitalSignsSection from "../components/EncounterVitalSignsSection";
import EncounterEvaSection from "../components/EncounterEvaSection";
import EncounterProcedures from "../components/EncounterProcedures";

type PageProps = {
  params: Promise<{
    id: string;
    encounterId: string;
  }>;
};

export default async function EncounterDetailPage({ params }: PageProps) {
  const { id: patientId, encounterId } = await params;

  const data: EncounterDetailData = await getEncounterDetailData(
    patientId,
    encounterId,
  );

  const {
    encounter,
    patient,
    practitionerName,
    vitalSigns,
    evaRecords,
    procedures,
  } = data;
  const backHref = `/patients/${patientId}/encounters`;

  if (!encounter) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-lg border border-border bg-surface p-6 text-center shadow-md">
          <h2 className="text-base font-semibold text-foreground mb-2">
            Encuentro no encontrado
          </h2>
          <p className="text-sm text-muted mb-4">
            No se encontró un encuentro con el ID proporcionado.
          </p>
          <Link href={backHref} className="text-sm text-primary">
            ← Volver
          </Link>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-lg border border-border bg-surface p-6 text-center shadow-md">
          <h2 className="text-base font-semibold text-foreground mb-2">
            Paciente no encontrado
          </h2>
          <p className="text-sm text-muted mb-4">
            No se encontró un paciente con el ID proporcionado.
          </p>
          <Link href={backHref} className="text-sm text-primary">
            ← Volver
          </Link>
        </div>
      </div>
    );
  }

  const patientName = formatPatientName(patient.name);
  const editable =
    encounter.status === "planned" || encounter.status === "in-progress";
  const readOnly =
    encounter.status === "finished" || encounter.status === "cancelled";
  const shouldRenderClinicalBlocks = encounter.status === "finished";
  const encounterStatusBadge = getEncounterStatusBadge(encounter.status);
  const plannedSchedule = formatPlannedSchedule(
    encounter.plannedDate,
    encounter.plannedTime,
  );
  const readOnlyStart = getEncounterRepresentativeStart(encounter);
  const readOnlyEnd = getEncounterRepresentativeEnd(encounter);
  const encounterDuration = formatEncounterDuration(encounter.durationMinutes);

  return (
    <div className="space-y-6">
      <Breadcrumbs patientName={patientName} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {formatEncounterVisitType(encounter.visitType)}
          </h1>
          <p className="text-sm text-muted">Paciente: {patientName}</p>
        </div>
        <Link href={backHref} className="text-sm text-primary">
          ← Volver
        </Link>
      </div>

      {editable && (
        <div className="space-y-4">
          {encounter.status === "planned" ? (
            <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
                    Resumen de la visita
                  </h2>
                  <p className="mt-1 text-base font-medium text-foreground">
                    Visita planificada
                  </p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${encounterStatusBadge.colorClass}`}
                >
                  {encounterStatusBadge.label}
                </span>
              </div>

              <dl className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-border/70 bg-background/60 p-4">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Fecha planificada
                  </dt>
                  <dd className="mt-2 text-xl font-semibold text-foreground">
                    {plannedSchedule.plannedDateLabel ??
                      "Sin fecha planificada"}
                  </dd>
                </div>
                <div className="rounded-lg border border-border/70 bg-background/60 p-4">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Hora programada
                  </dt>
                  <dd className="mt-2 text-xl font-semibold text-foreground">
                    {plannedSchedule.plannedTimeLabel ?? "Sin horario definido"}
                  </dd>
                </div>
                <div className="rounded-lg border border-border/70 bg-background/60 p-4">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Tipo de visita
                  </dt>
                  <dd className="mt-2 text-lg font-medium text-foreground">
                    {formatEncounterVisitType(encounter.visitType)}
                  </dd>
                  <p className="mt-3 text-sm text-muted">
                    Paciente: {patientName}
                  </p>
                </div>
              </dl>
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-surface p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
                Resumen de la visita
              </h2>
              <dl className="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                <div>
                  <dt className="font-medium text-foreground">Estado</dt>
                  <dd className="text-muted">{encounter.status}</dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">
                    Tipo de visita
                  </dt>
                  <dd className="text-muted">
                    {formatEncounterVisitType(encounter.visitType)}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">
                    Inicio real (referencia)
                  </dt>
                  <dd className="text-muted">
                    {formatDateTime(encounter.periodStart) ??
                      encounter.periodStart}
                  </dd>
                </div>
              </dl>
            </div>
          )}

          {encounter.status === "planned" ? (
            <PlannedFinalizeEncounterSection
              patientId={patientId}
              encounterId={encounterId}
              plannedDate={encounter.plannedDate}
              plannedTime={encounter.plannedTime}
            />
          ) : (
            <div className="rounded-lg border border-border bg-surface shadow-sm">
              <div className="border-b border-border px-6 pt-5 pb-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
                  Finalizar visita
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Completa los datos para registrar el cierre clínico.
                </p>
              </div>
              <div className="p-6">
                <FinalizeEncounterForm
                  patientId={patientId}
                  encounterId={encounterId}
                  practitionerName={practitionerName ?? "Profesional no disponible"}
                  plannedDate={encounter.plannedDate}
                  plannedTime={encounter.plannedTime}
                  actualStartAt={encounter.actualStartAt}
                />
              </div>
            </div>
          )}

        </div>
      )}

      {readOnly && (
        <div className="space-y-4">
          <p className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-700">
            Esta visita está finalizada y no puede editarse
          </p>

          <div className="rounded-lg border border-border bg-surface shadow-sm">
            <div className="border-b border-border px-6 pt-6 pb-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
                Resumen de la visita
              </h2>
            </div>
            <div className="p-6">
              <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                <div>
                  <dt className="font-medium text-foreground">Estado</dt>
                  <dd>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${encounterStatusBadge.colorClass}`}
                    >
                      {encounterStatusBadge.label}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">
                    Tipo de visita
                  </dt>
                  <dd className="text-muted">
                    {formatEncounterVisitType(encounter.visitType)}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Inicio real</dt>
                  <dd className="text-muted">
                    {formatDateTime(readOnlyStart) ?? readOnlyStart}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Fin real</dt>
                  <dd className="text-muted">
                    {formatDateTime(readOnlyEnd) ??
                      readOnlyEnd ??
                      "Sin registrar"}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Duración</dt>
                  <dd className="text-muted">
                    {encounterDuration ?? "Sin registrar"}
                  </dd>
                </div>
                <div className="md:col-span-2">
                  <dt className="font-medium text-foreground">
                    Motivo de la visita
                  </dt>
                  <dd className="text-muted whitespace-pre-wrap">
                    {encounter.reasonDisplay || "Sin registrar"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {shouldRenderClinicalBlocks && (
            <>
              {typeof encounter.clinicalNote === "string" &&
                encounter.clinicalNote.trim() !== "" && (
                  <EncounterClinicalNote note={encounter.clinicalNote} />
                )}
              {vitalSigns.length > 0 && (
                <EncounterVitalSignsSection records={vitalSigns} />
              )}
              {evaRecords.length > 0 && (
                <EncounterEvaSection records={evaRecords} />
              )}
              {procedures.length > 0 && (
                <EncounterProcedures procedures={procedures} />
              )}
            </>
          )}
        </div>
      )}
      {!editable && !readOnly && (
        <div className="rounded-md border border-border bg-surface p-4 text-sm text-muted">
          Estado de encuentro no reconocido: <strong>{encounter.status}</strong>
        </div>
      )}
    </div>
  );
}
