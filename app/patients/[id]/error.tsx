"use client";
import React from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div
      role="alert"
      className="min-h-[60vh] flex items-center justify-center p-6"
    >
      <div className="max-w-md w-full bg-surface border border-border rounded-lg shadow-md p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-error/10 shrink-0 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-error" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground mb-1">
              Error al cargar el paciente
            </h2>
            <p className="text-sm text-muted">
              {error?.message ??
                "Ocurrió un error al cargar los datos del paciente."}
            </p>
          </div>
        </div>
        <hr className="border-border my-4" />
        <div className="flex justify-end">
          <button
            onClick={() => reset()}
            className="px-4 py-2 rounded-md text-sm font-medium bg-primary text-white hover:bg-primary-hover transition-colors duration-150"
          >
            Reintentar
          </button>
        </div>
      </div>
    </div>
  );
}
