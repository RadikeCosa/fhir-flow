import type { FhirProcedure } from "../schemas/procedure.schema";
import type {
    Procedure,
    ProcedureStatus,
    ProcedureCategory,
    ProcedureCode,
} from "../../../domain/procedures/procedure";
import { PROCEDURE_SYSTEM } from "../../../lib/fhir/systems";

/**
 * Translate a raw FHIR status string into the domain union. Unknown values
 * default to `completed` which is a safe non-error fallback for procedures.
 */
function mapStatus(s?: string): ProcedureStatus {
    switch (s) {
        case "completed":
        case "in-progress":
        case "not-done":
            return s;
        default:
            return "completed";
    }
}

/**
 * Extract the ID portion from a reference of the form `ResourceType/id`.
 */
function extractId(ref?: string): string {
    if (typeof ref !== "string") return "";
    const parts = ref.split("/");
    return parts.length > 1 ? parts[1] : "";
}

/**
 * Given a system and code value from a FHIR coding, map it to the domain
 * category/code/display trio.  Returns `null` when the system is not the
 * expected `PROCEDURE_SYSTEM` or the code is unrecognised.
 */
function mapCode(
    system?: string,
    code?: string
): { category: ProcedureCategory; code: ProcedureCode; display: string } | null {
    if (system !== PROCEDURE_SYSTEM || !code) return null;

    switch (code) {
        // terapia-manual
        case "masoterapia":
            return {
                category: "terapia-manual",
                code: "masoterapia",
                display: "Masoterapia",
            };
        case "liberacion-miofascial":
            return {
                category: "terapia-manual",
                code: "liberacion-miofascial",
                display: "Liberación miofascial",
            };
        case "movilizacion-articular-pasiva":
            return {
                category: "terapia-manual",
                code: "movilizacion-articular-pasiva",
                display: "Movilización articular pasiva",
            };
        case "movilizacion-articular-activa-asistida":
            return {
                category: "terapia-manual",
                code: "movilizacion-articular-activa-asistida",
                display: "Movilización articular activa asistida",
            };
        case "manipulacion-articular":
            return {
                category: "terapia-manual",
                code: "manipulacion-articular",
                display: "Manipulación articular",
            };
        case "estiramiento-muscular":
            return {
                category: "terapia-manual",
                code: "estiramiento-muscular",
                display: "Estiramientos musculares",
            };
        case "inhibicion-muscular":
            return {
                category: "terapia-manual",
                code: "inhibicion-muscular",
                display: "Técnicas de inhibición muscular",
            };
        case "puntos-gatillo":
            return {
                category: "terapia-manual",
                code: "puntos-gatillo",
                display: "Puntos gatillo",
            };
        case "traccion-manual":
            return {
                category: "terapia-manual",
                code: "traccion-manual",
                display: "Tracción manual",
            };
        case "drenaje-linfatico":
            return {
                category: "terapia-manual",
                code: "drenaje-linfatico",
                display: "Drenaje linfático",
            };
        // ejercicio-terapeutico
        case "fortalecimiento":
            return {
                category: "ejercicio-terapeutico",
                code: "fortalecimiento",
                display: "Ejercicios de fortalecimiento",
            };
        case "resistencia-muscular":
            return {
                category: "ejercicio-terapeutico",
                code: "resistencia-muscular",
                display: "Ejercicios de resistencia muscular",
            };
        case "movilidad-articular-activa":
            return {
                category: "ejercicio-terapeutico",
                code: "movilidad-articular-activa",
                display: "Movilidad articular activa",
            };
        case "coordinacion":
            return {
                category: "ejercicio-terapeutico",
                code: "coordinacion",
                display: "Ejercicios de coordinación",
            };
        case "equilibrio":
            return {
                category: "ejercicio-terapeutico",
                code: "equilibrio",
                display: "Ejercicios de equilibrio",
            };
        case "reeducacion-marcha":
            return {
                category: "ejercicio-terapeutico",
                code: "reeducacion-marcha",
                display: "Reeducación de la marcha",
            };
        case "entrenamiento-funcional":
            return {
                category: "ejercicio-terapeutico",
                code: "entrenamiento-funcional",
                display: "Entrenamiento funcional",
            };
        case "entrenamiento-propioceptivo":
            return {
                category: "ejercicio-terapeutico",
                code: "entrenamiento-propioceptivo",
                display: "Entrenamiento propioceptivo",
            };
        case "ejercicios-bandas-elasticas":
            return {
                category: "ejercicio-terapeutico",
                code: "ejercicios-bandas-elasticas",
                display: "Ejercicios con bandas elásticas",
            };
        case "ejercicios-peso-corporal":
            return {
                category: "ejercicio-terapeutico",
                code: "ejercicios-peso-corporal",
                display: "Ejercicios con peso corporal",
            };
        case "rango-movimiento-rom":
            return {
                category: "ejercicio-terapeutico",
                code: "rango-movimiento-rom",
                display: "Rango de movimiento (ROM)",
            };
        case "ejercicios-linfokineticos":
            return {
                category: "ejercicio-terapeutico",
                code: "ejercicios-linfokineticos",
                display: "Ejercicios linfoquinéticos",
            };
        // rehabilitacion-neurologica
        case "facilitacion-neuromuscular-pnf":
            return {
                category: "rehabilitacion-neurologica",
                code: "facilitacion-neuromuscular-pnf",
                display: "Facilitación neuromuscular (PNF)",
            };
        case "control-postural":
            return {
                category: "rehabilitacion-neurologica",
                code: "control-postural",
                display: "Control postural",
            };
        case "reeducacion-motora":
            return {
                category: "rehabilitacion-neurologica",
                code: "reeducacion-motora",
                display: "Reeducación motora",
            };
        case "entrenamiento-avd":
            return {
                category: "rehabilitacion-neurologica",
                code: "entrenamiento-avd",
                display: "Entrenamiento de AVD",
            };
        case "reeducacion-equilibrio":
            return {
                category: "rehabilitacion-neurologica",
                code: "reeducacion-equilibrio",
                display: "Reeducación del equilibrio",
            };
        case "entrenamiento-transferencias":
            return {
                category: "rehabilitacion-neurologica",
                code: "entrenamiento-transferencias",
                display: "Entrenamiento de transferencias",
            };
        // rehabilitacion-respiratoria
        case "ejercicios-respiratorios":
            return {
                category: "rehabilitacion-respiratoria",
                code: "ejercicios-respiratorios",
                display: "Ejercicios respiratorios",
            };
        case "entrenamiento-muscular-respiratorio":
            return {
                category: "rehabilitacion-respiratoria",
                code: "entrenamiento-muscular-respiratorio",
                display: "Entrenamiento muscular respiratorio",
            };
        case "ventilacion-dirigida":
            return {
                category: "rehabilitacion-respiratoria",
                code: "ventilacion-dirigida",
                display: "Ventilación dirigida",
            };
        case "drenaje-bronquial":
            return {
                category: "rehabilitacion-respiratoria",
                code: "drenaje-bronquial",
                display: "Drenaje bronquial",
            };
        case "drenaje-postural":
            return {
                category: "rehabilitacion-respiratoria",
                code: "drenaje-postural",
                display: "Drenaje postural",
            };
        case "percusion-toracica":
            return {
                category: "rehabilitacion-respiratoria",
                code: "percusion-toracica",
                display: "Percusión torácica",
            };
        case "vibracion-toracica":
            return {
                category: "rehabilitacion-respiratoria",
                code: "vibracion-toracica",
                display: "Vibración torácica",
            };
        case "expansion-pulmonar-dirigida":
            return {
                category: "rehabilitacion-respiratoria",
                code: "expansion-pulmonar-dirigida",
                display: "Expansión pulmonar dirigida",
            };
        case "espiracion-lenta-prolongada":
            return {
                category: "rehabilitacion-respiratoria",
                code: "espiracion-lenta-prolongada",
                display: "Espiración lenta prolongada",
            };
        case "tos-asistida":
            return {
                category: "rehabilitacion-respiratoria",
                code: "tos-asistida",
                display: "Tos asistida",
            };
        case "espirometro-incentivo":
            return {
                category: "rehabilitacion-respiratoria",
                code: "espirometro-incentivo",
                display: "Espirómetro incentivo",
            };
        // fisioterapia
        case "laser":
            return {
                category: "fisioterapia",
                code: "laser",
                display: "Láser terapéutico",
            };
        case "onda-corta":
            return {
                category: "fisioterapia",
                code: "onda-corta",
                display: "Onda corta",
            };
        case "ultrasonido-terapeutico":
            return {
                category: "fisioterapia",
                code: "ultrasonido-terapeutico",
                display: "Ultrasonido terapéutico",
            };
        case "electroestimulacion-nmes":
            return {
                category: "fisioterapia",
                code: "electroestimulacion-nmes",
                display: "Electroestimulación muscular (NMES)",
            };
        case "corrientes-interferenciales":
            return {
                category: "fisioterapia",
                code: "corrientes-interferenciales",
                display: "Corrientes interferenciales",
            };
        case "electroanalgesia":
            return {
                category: "fisioterapia",
                code: "electroanalgesia",
                display: "Electroanalgesia",
            };
        case "crioterapia":
            return {
                category: "fisioterapia",
                code: "crioterapia",
                display: "Crioterapia",
            };
        case "termoterapia":
            return {
                category: "fisioterapia",
                code: "termoterapia",
                display: "Termoterapia",
            };
        case "magnetoterapia":
            return {
                category: "fisioterapia",
                code: "magnetoterapia",
                display: "Magnetoterapia",
            };
        // terapias-complementarias
        case "vendaje-neuromuscular":
            return {
                category: "terapias-complementarias",
                code: "vendaje-neuromuscular",
                display: "Vendaje neuromuscular (Kinesiotaping)",
            };
        case "vendaje-funcional":
            return {
                category: "terapias-complementarias",
                code: "vendaje-funcional",
                display: "Vendaje funcional",
            };
        case "compresion-elastica":
            return {
                category: "terapias-complementarias",
                code: "compresion-elastica",
                display: "Compresión elástica",
            };
        // educacion
        case "educacion-paciente":
            return {
                category: "educacion",
                code: "educacion-paciente",
                display: "Educación al paciente",
            };
        case "educacion-cuidador":
            return {
                category: "educacion",
                code: "educacion-cuidador",
                display: "Educación al cuidador",
            };
        case "uso-ayudas-tecnicas":
            return {
                category: "educacion",
                code: "uso-ayudas-tecnicas",
                display: "Entrenamiento en uso de ayudas técnicas",
            };
        case "prevencion-caidas":
            return {
                category: "educacion",
                code: "prevencion-caidas",
                display: "Prevención de caídas",
            };
        case "ergonomia-higiene-postural":
            return {
                category: "educacion",
                code: "ergonomia-higiene-postural",
                display: "Ergonomía e higiene postural",
            };
        default:
            return null;
    }
}

/**
 * Mapper from validated FHIR `Procedure` resource to the domain `Procedure`.
 * Returns `null` when the code/system combination is unrecognised so calling
 * repositories can safely drop the entry without throwing.
 */
export function mapFhirProcedureToDomain(
    resource: FhirProcedure
): Procedure | null {
    const status = mapStatus(resource.status);
    const id = resource.id;

    const encounterId = extractId(resource.encounter?.reference);
    const patientId = extractId(resource.subject?.reference);

    // code mapping
    let category: ProcedureCategory;
    let procedureCode: ProcedureCode;
    let display: string;
    if (
        resource.code?.coding &&
        Array.isArray(resource.code.coding) &&
        resource.code.coding.length > 0
    ) {
        const mapped = mapCode(
            resource.code.coding[0].system,
            resource.code.coding[0].code
        );
        if (!mapped) return null;
        category = mapped.category;
        procedureCode = mapped.code;
        display = mapped.display;
    } else {
        return null;
    }

    const bodySite =
        Array.isArray(resource.bodySite) && resource.bodySite.length > 0
            ? resource.bodySite[0].text || ""
            : undefined;

    let performerId: string | undefined;
    let performerName: string | undefined;
    if (
        Array.isArray(resource.performer) &&
        resource.performer.length > 0 &&
        resource.performer[0].actor
    ) {
        performerId = extractId(resource.performer[0].actor.reference);
        performerName = resource.performer[0].actor.display || undefined;
    }

    const note =
        Array.isArray(resource.note) && resource.note.length > 0
            ? resource.note[0].text || undefined
            : undefined;

    return {
        id,
        encounterId,
        patientId,
        status,
        category,
        code: procedureCode,
        display,
        bodySite,
        performerId,
        performerName,
        note,
    };
}
