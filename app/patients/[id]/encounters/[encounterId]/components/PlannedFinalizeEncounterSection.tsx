"use client";

import { useState } from "react";
import { startEncounterAction } from "../actions/start-encounter.action";

interface PlannedFinalizeEncounterSectionProps {
  patientId: string;
  encounterId: string;
}

export default function PlannedFinalizeEncounterSection({
  patientId,
  encounterId,
}: PlannedFinalizeEncounterSectionProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const handleStartEncounter = async () => {
    setErrorMessage(null);
    setIsStarting(true);

    const result = await startEncounterAction(patientId, encounterId);
    if (!result.success) {
      setErrorMessage(result.error.message);
      setIsStarting(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-surface shadow-sm">
      <div className="border-b border-border px-6 pt-5 pb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Próximo paso
        </h2>
        <p className="mt-1 text-sm text-muted">
          La visita está planificada. Iniciá la visita para habilitar el cierre
          clínico.
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
                Al iniciar la visita se registrará el comienzo real en la
                historia clínica.
              </p>
            </div>

            <button
              type="button"
              onClick={handleStartEncounter}
              disabled={isStarting}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors duration-150 hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isStarting ? "Iniciando..." : "Iniciar visita"}
            </button>
          </div>
        </div>
        {errorMessage && (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </p>
        )}
      </div>
    </div>
  );
}
