import PatientList from "./components/PatientList";
import { createPatientRepository } from "../../infrastructure/fhir/patient.factory";

/**
 * Patients page (Server Component).
 *
 * Responsibilities:
 * - Fetch patient data from the domain repository (infrastructure wiring).
 * - Pass domain `Patient[]` to `PatientList` for rendering.
 */
export default async function Page() {
  const repo = createPatientRepository();
  const result = await repo.findMany();
  const items = result.items ?? [];

  return <PatientList items={items} />;
}
