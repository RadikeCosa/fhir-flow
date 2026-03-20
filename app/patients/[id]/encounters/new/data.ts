import type { EpisodeOfCare } from "@/domain/episode-of-care/episode-of-care";
import { currentPractitionerId } from "@/config/fhir.config";
import { createEpisodeOfCareRepository, createPatientRepository } from "@/infrastructure/fhir/factories";
import { formatPatientName } from "@/lib/patient/formatters";
import { getCurrentPractitioner } from "@/lib/server/current-practitioner";

export interface NewEncounterPageData {
    patientName: string;
    practitionerName: string;
    activeEpisodes: EpisodeOfCare[];
}

export async function getNewEncounterPageData(patientId: string): Promise<NewEncounterPageData> {
    const patientRepo = createPatientRepository();
    const episodeRepo = createEpisodeOfCareRepository();

    const patientNamePromise = (async () => {
        try {
            const patient = await patientRepo.findById(patientId);
            return patient ? formatPatientName(patient.name) : "";
        } catch {
            return "";
        }
    })();

    const practitionerNamePromise = (async () => {
        try {
            const practitioner = await getCurrentPractitioner();
            return practitioner.displayName;
        } catch {
            return currentPractitionerId;
        }
    })();

    const episodes = await episodeRepo.findAllByPatientId(patientId);
    const activeEpisodes = episodes.filter((e) => e.status === "active");

    const [patientName, practitionerName] = await Promise.all([
        patientNamePromise,
        practitionerNamePromise,
    ]);

    return {
        patientName,
        practitionerName,
        activeEpisodes,
    };
}
