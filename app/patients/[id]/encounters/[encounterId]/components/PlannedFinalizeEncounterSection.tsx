"use client";

import { useState } from "react";
import FinalizeEncounterForm from "./FinalizeEncounterForm";

interface PlannedFinalizeEncounterSectionProps {
  patientId: string;
  encounterId: string;
  practitionerName: string;
  plannedDate?: string;
  plannedTime?: string;
}

export default function PlannedFinalizeEncounterSection({
  patientId,
  encounterId,
  practitionerName,
  plannedDate,
  plannedTime,
}: PlannedFinalizeEncounterSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-border bg-surface shadow-sm">
      <div className="border-b border-border px-6 pt-5 pb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Próximo paso
        </h2>
        <p className="mt-1 text-sm text-muted">
          La visita está planificada. Expandí el formulario para registrar el
          cierre clínico.
        </p>
      </div>

      <div className="p-6">
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <p className="text-base font-semibold text-foreground">
                Visita pendiente
              </p>
              <p className="text-sm text-muted">
                Cuando completes el cierre, se guardarán los datos clínicos de
                esta visita.
              </p>
            </div>

            {!isExpanded ? (
              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors duration-150 hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Completar cierre
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="inline-flex items-center justify-center rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Ocultar formulario
              </button>
            )}
          </div>
        </div>

        {isExpanded && (
          <div className="mt-5 space-y-4 border-t border-border pt-5">
            <div className="rounded-md border border-border bg-background/60 px-4 py-3 text-sm text-muted">
              Formulario de finalización desplegado.
            </div>

            <FinalizeEncounterForm
              patientId={patientId}
              encounterId={encounterId}
              practitionerName={practitionerName}
              plannedDate={plannedDate}
              plannedTime={plannedTime}
            />
          </div>
        )}
      </div>
    </div>
  );
}
