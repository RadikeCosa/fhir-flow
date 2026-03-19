import { cache } from "react";
import { currentPractitionerId } from "@/config/fhir.config";
import type { Practitioner } from "@/domain/practitioners/practitioner";
import { FhirMapperError } from "@/domain/shared/error-types";
import { createPractitionerRepository } from "@/infrastructure/fhir/factories";

export const getCurrentPractitioner = cache(async (): Promise<Practitioner> => {
  const practitionerRepo = createPractitionerRepository();
  const practitioner = await practitionerRepo.findById(currentPractitionerId);

  if (!practitioner) {
    throw new FhirMapperError(
      `Current practitioner ${currentPractitionerId} could not be resolved from FHIR`,
      "CURRENT_PRACTITIONER_NOT_FOUND",
    );
  }

  if (!practitioner.displayName || practitioner.displayName.trim() === "") {
    throw new FhirMapperError(
      `Current practitioner ${currentPractitionerId} does not have a displayable name in FHIR`,
      "CURRENT_PRACTITIONER_NAME_MISSING",
    );
  }

  return {
    id: practitioner.id,
    displayName: practitioner.displayName,
  };
});
