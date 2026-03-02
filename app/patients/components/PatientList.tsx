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
    <div className="space-y-4 p-4">
      {items.map((p) => (
        <PatientCard key={p.id} patient={p} />
      ))}
    </div>
  );
}
