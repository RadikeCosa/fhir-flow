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
  // guard against any malformed records coming from the repository. In
  // practice this should never happen thanks to our mapper/schema, but a
  // defensive filter ensures we never render cards that would navigate to
  // an invalid detail URL.
  const items = (result.items ?? []).filter((p) => {
    const ok = typeof p.id === "string" && p.id.trim() !== "";
    // invalid ids are simply excluded; the mapper/schema should prevent this
    // but we can't risk rendering a card that would produce a broken link.
    // console logging is prohibited as an error handling mechanism per project
    // rules, so we document the rationale here instead of emitting a warning.
    return ok;
  });

  return <PatientList items={items} />;
}
