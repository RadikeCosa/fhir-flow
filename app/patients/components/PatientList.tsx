import type { Patient } from "../../../domain/patient";
import PatientCard from "./PatientCard";
import EmptyState from "./EmptyState";

/**
 * Presentational list of patients.
 *
 * - Receives domain `Patient[]` and renders either an empty state or
 *   a sequence of `PatientCard` components.
 */
export default function PatientList({ items }: { items: Patient[] }) {
  if (!items || items.length === 0) return <EmptyState />;

  return (
    <div
      role="region"
      aria-label="Lista de pacientes"
      aria-live="polite"
      className="w-full"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Pacientes</h2>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
          {items.length} registrados
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => (
          <PatientCard key={p.id} patient={p} />
        ))}
      </div>
    </div>
  );
}
