/**
 * Domain definitions for procedures. This file lives entirely within the
 * domain layer and is intentionally agnostic of FHIR or any other external
 * representation. It includes only the fields and type unions required by
 * application business logic and UI components.
 */

/**
 * Allowed status values for a procedure within the domain.
 */
export type ProcedureStatus =
    | "completed"
    | "in-progress"
    | "not-done";

/**
 * Category classification for procedures. These values are fixed and
 * correspond to the supported grouping in the application.
 */
export type ProcedureCategory =
    | "terapia-manual"
    | "ejercicio-terapeutico"
    | "rehabilitacion-neurologica"
    | "rehabilitacion-respiratoria"
    | "fisioterapia"
    | "terapias-complementarias"
    | "educacion";

/**
 * Runtime representation of supported procedure categories derived from the
 * `ProcedureCategory` domain union. Used by Zod schema builders that require
 * runtime value arrays.
 */
export const ProcedureCategoryValues = [
    "terapia-manual",
    "ejercicio-terapeutico",
    "rehabilitacion-neurologica",
    "rehabilitacion-respiratoria",
    "fisioterapia",
    "terapias-complementarias",
    "educacion",
] as const;

/**
 * Codes representing specific procedures, grouped by category.  The union
 * includes every code associated with a particular `ProcedureCategory`.
 */
export type ProcedureCode =
    | /* terapia-manual */
    "masoterapia"
    | "liberacion-miofascial"
    | "movilizacion-articular-pasiva"
    | "movilizacion-articular-activa-asistida"
    | "manipulacion-articular"
    | "estiramiento-muscular"
    | "inhibicion-muscular"
    | "puntos-gatillo"
    | "traccion-manual"
    | "drenaje-linfatico"
    | /* ejercicio-terapeutico */
    "fortalecimiento"
    | "ejercicios-linfokineticos"
    | "resistencia-muscular"
    | "movilidad-articular-activa"
    | "coordinacion"
    | "equilibrio"
    | "reeducacion-marcha"
    | "entrenamiento-funcional"
    | "entrenamiento-propioceptivo"
    | "ejercicios-bandas-elasticas"
    | "ejercicios-peso-corporal"
    | "rango-movimiento-rom"
    | /* rehabilitacion-neurologica */
    "facilitacion-neuromuscular-pnf"
    | "control-postural"
    | "reeducacion-motora"
    | "entrenamiento-avd"
    | "reeducacion-equilibrio"
    | "entrenamiento-transferencias"
    | /* rehabilitacion-respiratoria */
    "ejercicios-respiratorios"
    | "entrenamiento-muscular-respiratorio"
    | "ventilacion-dirigida"
    | "drenaje-bronquial"
    | "drenaje-postural"
    | "percusion-toracica"
    | "vibracion-toracica"
    | "expansion-pulmonar-dirigida"
    | "espiracion-lenta-prolongada"
    | "tos-asistida"
    | "espirometro-incentivo"
    | /* fisioterapia */
    "ultrasonido-terapeutico"
    | "laser"
    | "onda-corta"
    | "electroestimulacion-nmes"
    | "corrientes-interferenciales"
    | "electroanalgesia"
    | "crioterapia"
    | "termoterapia"
    | "magnetoterapia"
    | /* terapias-complementarias */
    "vendaje-neuromuscular"
    | "vendaje-funcional"
    | "compresion-elastica"
    | /* educacion */
    "educacion-paciente"
    | "educacion-cuidador"
    | "uso-ayudas-tecnicas"
    | "prevencion-caidas"
    | "ergonomia-higiene-postural";

/**
 * Runtime representation of supported procedure codes derived from the
 * `ProcedureCode` domain union. Used by Zod schema builders that require
 * runtime value arrays.
 */
export const ProcedureCodeValues = [
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
    "facilitacion-neuromuscular-pnf",
    "control-postural",
    "reeducacion-motora",
    "entrenamiento-avd",
    "reeducacion-equilibrio",
    "entrenamiento-transferencias",
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
    "ultrasonido-terapeutico",
    "laser",
    "onda-corta",
    "electroestimulacion-nmes",
    "corrientes-interferenciales",
    "electroanalgesia",
    "crioterapia",
    "termoterapia",
    "magnetoterapia",
    "vendaje-neuromuscular",
    "vendaje-funcional",
    "compresion-elastica",
    "educacion-paciente",
    "educacion-cuidador",
    "uso-ayudas-tecnicas",
    "prevencion-caidas",
    "ergonomia-higiene-postural",
] as const;

/**
 * Core domain representation of a procedure ordered or performed during an
 * encounter. Optional fields reflect data that may be absent in some
 * records.
 */
export interface Procedure {
    id: string;
    encounterId: string;
    patientId: string;

    status: ProcedureStatus;
    category: ProcedureCategory;
    code: ProcedureCode;

    /**
     * Human-readable display text for the code. Should be mapped by
     * infrastructure from whichever source system produced the procedure.
     */
    display: string;

    /**
     * Body site involved (optional, free-text). The domain makes no attempt
     * to enforce a specific coding system here.
     */
    bodySite?: string;

    /** Performer information (optional). Only identifier and name are stored.
     */
    performerId?: string;
    performerName?: string;

    /** Optional textual note or comment associated with the procedure. */
    note?: string;
}
