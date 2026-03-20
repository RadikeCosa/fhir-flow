import Link from "next/link";
import Breadcrumbs from "../../../../components/Breadcrumbs";
import FinalizeEncounterForm from "./components/FinalizeEncounterForm";
import { getEncounterDetailData, type EncounterDetailData } from "./data";
import { formatDateTime, formatPatientName } from "@/lib/patient/formatters";
import {
  formatEncounterVisitType,
  getEncounterStatusBadge,
} from "@/lib/patient/formatters/encounter.formatters";

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

  const { encounter, patient, practitioner } = data;
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
  const encounterStatusBadge = getEncounterStatusBadge(encounter.status);

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
                <dt className="font-medium text-foreground">Tipo de visita</dt>
                <dd className="text-muted">
                  {formatEncounterVisitType(encounter.visitType)}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">
                  Inicio del período
                </dt>
                <dd className="text-muted">
                  {formatDateTime(encounter.periodStart) ??
                    encounter.periodStart}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg border border-border bg-surface shadow-sm">
            <div className="border-b border-border px-6 pt-6 pb-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
                Finalizar visita
              </h2>
            </div>
            <div className="p-6">
              <FinalizeEncounterForm
                patientId={patientId}
                encounterId={encounterId}
                patientName={patientName}
                practitionerName={practitioner.displayName}
                periodStart={encounter.periodStart}
                periodStartFormatted={
                  formatDateTime(encounter.periodStart) ?? encounter.periodStart
                }
              />
            </div>
          </div>
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
                  <dt className="font-medium text-foreground">
                    Inicio del período
                  </dt>
                  <dd className="text-muted">
                    {formatDateTime(encounter.periodStart) ??
                      encounter.periodStart}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">
                    Fin del período
                  </dt>
                  <dd className="text-muted">
                    {formatDateTime(encounter.periodEnd) ??
                      encounter.periodEnd ??
                      "Sin registrar"}
                  </dd>
                </div>
                <div className="md:col-span-2">
                  <dt className="font-medium text-foreground">Nota clínica</dt>
                  <dd className="text-muted whitespace-pre-wrap">
                    {encounter.clinicalNote || "Sin registrar"}
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
