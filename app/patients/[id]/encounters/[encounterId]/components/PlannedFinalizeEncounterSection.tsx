"use client";

import { useState } from "react";
import {
  APP_TIME_ZONE,
  formatCalendarDateInTimeZone,
} from "../../../../../../lib/date-time/date-time.utils";
import { startEncounterAction } from "../actions/start-encounter.action";

interface PlannedFinalizeEncounterSectionProps {
  patientId: string;
  encounterId: string;
  plannedDate?: string;
  plannedTime?: string;
}

function getCurrentLocalTimeLabel(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(now);
}

export default function PlannedFinalizeEncounterSection({
  patientId,
  encounterId,
  plannedDate,
  plannedTime,
}: PlannedFinalizeEncounterSectionProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [actualStartDate, setActualStartDate] = useState(
    plannedDate || formatCalendarDateInTimeZone(new Date()),
  );
  const [actualStartTime, setActualStartTime] = useState(
    plannedTime || getCurrentLocalTimeLabel(),
  );

  const handleStartEncounter = async () => {
    setErrorMessage(null);
    setIsStarting(true);

    const result = await startEncounterAction(
      patientId,
      encounterId,
      actualStartDate,
      actualStartTime,
    );
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
                Confirmá o ajustá el inicio real antes de iniciar la visita.
              </p>
            </div>

            <div className="grid w-full max-w-sm grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="actualStartDate"
                  className="block text-xs font-medium text-muted"
                >
                  Fecha real
                </label>
                <input
                  id="actualStartDate"
                  type="date"
                  value={actualStartDate}
                  onChange={(event) => setActualStartDate(event.target.value)}
                  className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="actualStartTime"
                  className="block text-xs font-medium text-muted"
                >
                  Hora real
                </label>
                <input
                  id="actualStartTime"
                  type="time"
                  step={300}
                  value={actualStartTime}
                  onChange={(event) => setActualStartTime(event.target.value)}
                  className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="mt-4">
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
