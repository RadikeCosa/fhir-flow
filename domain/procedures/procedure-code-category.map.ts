import type { ProcedureCategory, ProcedureCode } from "./procedure";

/**
 * Mapping of each procedure category to its allowed procedure codes.
 *
 * This map is derived from the domain union definitions in
 * `domain/procedures/procedure.ts`. The source-of-truth values are the
 * `ProcedureCode` literals in that file; this map mirrors the same grouping
 * while keeping the category-code relation explicit for validation.
 *
 * We avoid hardcoding in the schema by using this single shared map. If new
 * codes are added in `procedure.ts`, this map should be updated accordingly.
 */
export const PROCEDURE_CODES_BY_CATEGORY: Record<ProcedureCategory, readonly ProcedureCode[]> = {
    "terapia-manual": [
        "masoterapia",
        "liberacion-miofascial",
        "movilizacion-articular-pasiva",
        "movilizacion-articular-activa-asistida",
        "manipulacion-articular",
        "estiramiento-muscular",
        "inhibicion-muscular",
        "puntos-gatillo",
        "traccion-manual",
        "drenaje-linfatico",
    ],
    "ejercicio-terapeutico": [
        "fortalecimiento",
        "ejercicios-linfokineticos",
        "resistencia-muscular",
        "movilidad-articular-activa",
        "coordinacion",
        "equilibrio",
        "reeducacion-marcha",
        "entrenamiento-funcional",
        "entrenamiento-propioceptivo",
        "ejercicios-bandas-elasticas",
        "ejercicios-peso-corporal",
        "rango-movimiento-rom",
    ],
    "rehabilitacion-neurologica": [
        "facilitacion-neuromuscular-pnf",
        "control-postural",
        "reeducacion-motora",
        "entrenamiento-avd",
        "reeducacion-equilibrio",
        "entrenamiento-transferencias",
    ],
    "rehabilitacion-respiratoria": [
        "ejercicios-respiratorios",
        "entrenamiento-muscular-respiratorio",
        "ventilacion-dirigida",
        "drenaje-bronquial",
        "drenaje-postural",
        "percusion-toracica",
        "vibracion-toracica",
        "expansion-pulmonar-dirigida",
        "espiracion-lenta-prolongada",
        "tos-asistida",
        "espirometro-incentivo",
    ],
    "fisioterapia": [
        "ultrasonido-terapeutico",
        "laser",
        "onda-corta",
        "electroestimulacion-nmes",
        "corrientes-interferenciales",
        "electroanalgesia",
        "crioterapia",
        "termoterapia",
        "magnetoterapia",
    ],
    "terapias-complementarias": [
        "vendaje-neuromuscular",
        "vendaje-funcional",
        "compresion-elastica",
    ],
    educacion: [
        "educacion-paciente",
        "educacion-cuidador",
        "uso-ayudas-tecnicas",
        "prevencion-caidas",
        "ergonomia-higiene-postural",
    ],
};
