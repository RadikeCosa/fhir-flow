import type { Practitioner } from "./practitioner";

/**
 * Contract for reading practitioner data needed by the application.
 */
export interface PractitionerRepository {
    findById(id: string): Promise<Practitioner | null>;
}
