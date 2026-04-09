import type { ActionError } from "@/domain/shared/action-result.types";

const ERROR_LAYER_TITLE: Record<ActionError["layer"], string> = {
  validation: "Error de validación",
  domain: "Error de reglas clínicas",
  fhir: "Error al guardar en el servidor",
};

interface EncounterActionErrorBannerProps {
  error: ActionError;
}

export function EncounterActionErrorBanner({
  error,
}: EncounterActionErrorBannerProps) {
  return (
    <div className="rounded-md border border-red-200 bg-red-50 p-4">
      <h3 className="text-sm font-semibold text-red-800">
        {ERROR_LAYER_TITLE[error.layer]}
      </h3>
      <p className="mt-1 text-sm text-red-700">{error.message}</p>
      {error.code && <p className="mt-1 text-xs text-red-600">Código: {error.code}</p>}
    </div>
  );
}
