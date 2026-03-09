import Link from "next/link";
import { notFound } from "next/navigation";
import { createPatientRepository } from "@/infrastructure/fhir/factories/patient.factory";
import { createEncounterRepository } from "@/infrastructure/fhir/factories/encounter.factory";
import { createVitalSignRecordRepository } from "@/infrastructure/fhir/factories/vital-sign-record.factory";
import { createAssessmentRepository } from "@/infrastructure/fhir/factories/assessment.factory";
import { createProcedureRepository } from "@/infrastructure/fhir/factories/procedure.factory";
import { formatDate } from "@/lib/patient/formatters";
import type { Encounter } from "@/domain/encounters/encounter";
import { VitalSignsSection } from "../../../components/detail/VitalSignsSection";
import { EvaAssessmentSection } from "../../../components/detail/assessments/EvaAssessmentSection";
import { ProcedureSection } from "../../../components/detail/ProcedureSection";

interface Props {
  params: Promise<{ id: string; encounterId: string }>;
}

function translateVisitType(type: Encounter["visitType"]): string {
  switch (type) {
    case "initial":
      return "Visita inicial";
    case "follow-up":
      return "Visita de seguimiento";
    case "discharge":
      return "Alta";
    default:
      return type;
  }
}

function statusBadge(status: Encounter["status"]) {
  switch (status) {
    case "planned":
      return { label: "Planificada", colorClass: "bg-gray-100 text-gray-800" };
    case "in-progress":
      return { label: "En curso", colorClass: "bg-primary/10 text-primary" };
    case "finished":
      return { label: "Finalizada", colorClass: "bg-success/10 text-success" };
    case "cancelled":
      return { label: "Cancelada", colorClass: "bg-error/10 text-error" };
    default:
      return {
        label: status || "Desconocido",
        colorClass: "bg-gray-100 text-gray-800",
      };
  }
}

export default async function Page({ params }: Props) {
  const { id: patientId, encounterId } = await params;

  const patientRepo = createPatientRepository();
  const encounterRepo = createEncounterRepository();
  const vitalRepo = createVitalSignRecordRepository();
  const assessmentRepo = createAssessmentRepository();
  const procedureRepo = createProcedureRepository();

  const [patient, encounter, vitalSigns, evaRecords, procedures] =
    await Promise.all([
      patientRepo.findById(patientId),
      encounterRepo.findById(encounterId),
      vitalRepo.findAllByEncounterId(encounterId),
      assessmentRepo.findEvaByEncounterId(encounterId),
      procedureRepo.findAllByEncounterId(encounterId),
    ]);

  if (!patient || !encounter) {
    notFound();
  }

  const hasClinicalData =
    vitalSigns.length > 0 || evaRecords.length > 0 || procedures.length > 0;

  return (
    <>
      <div className="mb-4">
        <Link
          href={`/patients/${patientId}/encounters`}
          className="text-sm text-primary"
        >
          ← Volver
        </Link>
      </div>

      <h1 className="text-xl font-semibold mb-4">
        {translateVisitType(encounter.visitType)} —{" "}
        {formatDate(encounter.periodStart) ?? ""}
      </h1>

      <section className="mb-6 p-3 bg-surface border border-border rounded-lg">
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
          {encounter.participant && (
            <>
              <dt className="text-xs text-muted font-medium">Profesional:</dt>
              <dd className="text-sm text-foreground">
                {encounter.participant.practitionerName}{" "}
                {encounter.participant.role &&
                  `(${encounter.participant.role})`}
              </dd>
            </>
          )}

          {typeof encounter.durationMinutes === "number" && (
            <>
              <dt className="text-xs text-muted font-medium">Duración:</dt>
              <dd className="text-sm text-foreground">
                {encounter.durationMinutes} min
              </dd>
            </>
          )}

          {encounter.reasonDisplay && (
            <>
              <dt className="text-xs text-muted font-medium">Motivo:</dt>
              <dd className="text-sm text-foreground">
                {encounter.reasonDisplay}
              </dd>
            </>
          )}

          <dt className="text-xs text-muted font-medium">Estado:</dt>
          <dd>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge(encounter.status).colorClass}`}
            >
              {statusBadge(encounter.status).label}
            </span>
          </dd>
        </dl>
      </section>

      {!hasClinicalData ? (
        <div className="text-sm text-muted italic">
          No hay registros clínicos para esta visita
        </div>
      ) : (
        <>
          <VitalSignsSection
            record={vitalSigns[0] ?? null}
            patientId={patientId}
          />
          <EvaAssessmentSection records={evaRecords} patientId={patientId} />
          <ProcedureSection procedures={procedures} />
        </>
      )}
    </>
  );
}
