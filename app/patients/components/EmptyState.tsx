/**
 * Simple empty state shown when no patients are available.
 */
export default function EmptyState() {
  return (
    <div
      role="status"
      aria-label="Sin resultados"
      className="flex flex-col items-center justify-center py-16 px-8 text-center"
    >
      <div className="w-12 h-12 rounded-full bg-border flex items-center justify-center mb-4">
        <div className="w-5 h-5 rounded-sm bg-muted opacity-50" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">
        Sin pacientes registrados
      </h3>
      <p className="text-sm text-muted">
        No hay pacientes para mostrar en este momento.
      </p>
    </div>
  );
}
