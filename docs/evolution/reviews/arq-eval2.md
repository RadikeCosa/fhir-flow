> **Nota de revisión histórica**
> 
> Este documento es un informe de revisión puntual (artefacto de evaluación), no una fuente de verdad operativa ni técnica.
> La documentación de autoridad actual está en `docs/adr/ADR-001-encounter-lifecycle-and-write-architecture.md`, `docs/write-phase-architecture.md`, y `docs/validacion-arquitectonica.md`.
> 
Informe de Arquitectura y Calidad — FHIR Flow

1. Resumen Ejecutivo
El repositorio implementa correctamente los principios fundamentales de la arquitectura hexagonal: la separación entre dominio, infraestructura y UI es sólida, el cliente HTTP está centralizado, y el flujo de escritura respeta las capas definidas en los documentos de arquitectura. Sin embargo, existen problemas de severidad alta concentrados en tres áreas: la integridad de los datos clínicos que se persisten al finalizar un encuentro, la UX del formulario de finalización que expone internos técnicos al profesional de salud, y brechas en el ciclo de vida del Encounter que fragmentan la experiencia clínica. Hay además una inconsistencia documental grave en phase-1-implementation-plan.md que requiere atención inmediata.

2. Hallazgos de UI
2.1 Formulario FinalizeEncounterForm expone IDs internos al usuario
Severidad: Alta
Ubicación: app/patients/[id]/encounters/[encounterId]/components/FinalizeEncounterForm/index.tsx
Observación: El formulario muestra literalmente Paciente: patient-1, Encuentro: enc-123 y Inicio del período: 2026-03-20T10:00:00.000Z — valores de infraestructura sin formato.
Por qué es problema: Un kinesiólogo no debería ver IDs de recursos FHIR ni timestamps ISO. Es una fuga de la capa de infraestructura hacia la UI clínica.
Impacto: Friccción UX severa; el profesional pierde confianza en el sistema. Viola el principio de que la UI no muestra FHIR crudo.
Recomendación: El Server Component EncounterDetailPage ya recibe patient y encounter. Debe pasar el nombre del paciente formateado y la fecha legible mediante los formateadores existentes (formatPatientName, formatDateTime) como props al formulario cliente. El formulario solo recibe datos listos para mostrar.

2.2 La página de detalle de encuentro finalizado no muestra datos clínicos
Severidad: Alta
Ubicación: app/patients/[id]/encounters/[encounterId]/page.tsx — rama readOnly
Observación: Cuando encounter.status === "finished", la página muestra solo un resumen con estado, tipo, fechas y nota clínica. No muestra signos vitales, procedimientos, EVA ni evaluaciones.
Por qué es problema: El flujo clínico completo solo es visible en app/patients/[id]/encounters/page.tsx (lista de encuentros). La URL canónica de un encuentro específico (/encounters/[encounterId]) no tiene la información completa.
Impacto: Para revisar el detalle de una visita finalizada, el profesional debe ir a la lista general y expandir manualmente cada tarjeta. No hay deep link clínico funcional.
Recomendación: El Server Component de detalle debe cargar y mostrar vitals, EVA y procedimientos cuando el encuentro está finalizado, usando los mismos repositorios ya existentes pero en contexto de solo lectura. Se puede reutilizar EncounterVitalSignsSection, EncounterProcedures y EncounterEvaSection.

2.3 La página de creación de encuentro lanza Error crudo en casos de error de negocio
Severidad: Media
Ubicación: app/patients/[id]/encounters/new/page.tsx
Observación: Si no hay episodio activo o hay múltiples episodios activos, el componente lanza throw new Error(...). Next.js captura esto con error.tsx, que muestra un mensaje genérico de "algo salió mal" con un botón de reintentar que no tiene sentido en ese contexto.
Por qué es problema: Estas son condiciones de negocio esperables (episodio cerrado, datos inconsistentes), no errores de sistema. El error.tsx genérico no informa al profesional qué hacer.
Impacto: El profesional queda bloqueado sin un camino de resolución claro.
Recomendación: Renderizar un estado de error explícito inline dentro del componente página (similar al patrón de "Paciente no encontrado" en /patients/[id]/page.tsx), con un mensaje clínico y un enlace de retorno al perfil del paciente.

2.4 Los dropdowns de procedimientos en FinalizeEncounterForm muestran códigos técnicos
Severidad: Media
Ubicación: app/patients/[id]/encounters/[encounterId]/components/FinalizeEncounterForm/index.tsx
Observación: Los <option> del selector de categoría y código de procedimiento renderizan los valores del dominio directamente (ej. "terapia-manual", "masoterapia"), no sus etiquetas en español.
Por qué es problema: Los formatters formatProcedureCategory y el display de cada ProcedureCode ya existen en lib/patient/formatters/procedure.formatters.ts. No se usan aquí.
Impacto: Fricción clínica. El kinesiólogo debe interpretar claves técnicas, no nombres médicos en su idioma.
Recomendación: Usar formatProcedureCategory para los valores de categoría, y construir un mapa de ProcedureCode → display derivado del mapper existente (procedure.mapper.ts ya tiene todos los displayNames) para renderizar las opciones.

2.5 La validación de fecha mínima en CreateEncounterForm tiene una condición de carrera
Severidad: Baja
Ubicación: app/patients/[id]/encounters/new/components/CreateEncounterForm/index.tsx
Observación: El minDateTime del input datetime-local se calcula en useEffect al montar el componente. La validación Zod en el schema calcula new Date() en el momento del submit. Si el usuario abre el formulario y lo deja 10 minutos sin interacción, el min del input queda desactualizado, pero la validación Zod puede rechazar fechas que el input muestra como válidas.
Por qué es problema: El input HTML y el validador Zod tienen relojes diferentes.
Impacto: Errores de validación confusos para el usuario ("Fecha no puede ser anterior al momento actual") cuando visualmente parece correcta.
Recomendación: Evaluar si la restricción de fecha mínima en el input HTML es suficiente guía visual, delegando la validación definitiva a Zod al momento del submit. O sincronizar el minDateTime con un intervalo periódico.

2.6 La sección EVA en FinalizeEncounterForm está oculta por defecto
Severidad: Media
Ubicación: app/patients/[id]/encounters/[encounterId]/components/FinalizeEncounterForm/index.tsx
Observación: showEva = false es el valor inicial. El profesional debe hacer clic en "EVA ▼" para ver y completar la puntuación de dolor.
Por qué es problema: La EVA es una métrica central del seguimiento clínico en este contexto (kinesiólogos de internación domiciliaria). Ocultarla por defecto sugiere que es opcional o secundaria.
Impacto: Subtregistro del dolor. El profesional puede finalizar la visita sin registrar EVA.
Recomendación: Mostrar la sección EVA expandida por defecto, o considerar un diseño inline con el campo siempre visible dado que es un campo simple (número 0-10).

2.7 app/patients/[id]/encounters/page.tsx instancia 9 repositorios directamente en el componente
Severidad: Media
Ubicación: app/patients/[id]/encounters/page.tsx
Observación: La página instancia directamente createPatientRepository(), createEpisodeOfCareRepository(), createEncounterRepository() y seis repositorios más, hace múltiples Promise.all anidados y construye mapas. Toda la lógica de orquestación está en el componente.
Por qué es problema: El patrón establecido en el proyecto es centralizar el fetching en data.ts (como en app/patients/[id]/data.ts). Esta página rompe la consistencia del patrón.
Impacto: El componente de página mezcla orquestación de datos con estructura de layout. Dificulta testing y mantenimiento.
Recomendación: Extraer toda la lógica de fetching a app/patients/[id]/encounters/data.ts con una función getEncountersPageData(patientId: string), siguiendo el patrón de getPatientDetailData.

3. Hallazgos del Write Flow
3.1 mapToFhirEncounterUpdate no incluye el campo type — la clasificación de visita se pierde al finalizar
Severidad: Crítica
Ubicación: infrastructure/fhir/mappers/encounter.finalize.mapper.ts
Observación: La operación PUT que finaliza el encuentro construye un recurso FHIR sin el array type (que contiene el código initial/follow-up/re-assessment/discharge). Un PUT en FHIR reemplaza el recurso completo. El visitType del encuentro se borrará en el servidor.
Por qué es problema: Un PUT sin type resulta en un Encounter FHIR sin clasificación de visita. Al releerlo, el mapper mapFhirEncounterToEncounter devolvería visitType: "follow-up" por defecto para todos los encuentros finalizados, independientemente de su tipo real.
Impacto: Corrupción de datos clínicos. Todas las visitas iniciales, re-evaluaciones y altas quedarían clasificadas como seguimientos después de ser finalizadas. Afecta a la lógica de filtrado en data.ts, a ReAssessmentSection, y a la InitialEvaluationSection.
Recomendación: El mapper de finalización debe incluir el campo type con el visitType del encounter original. El FinalizeEncounterInput debe incluir el campo visitType para que el mapper pueda construirlo correctamente.

3.2 mapToFhirProcedures asigna bodySite como display del coding de procedimiento
Severidad: Alta
Ubicación: infrastructure/fhir/mappers/procedure.write.mapper.ts
Observación: En la entrada de coding del procedimiento, el campo display se asigna como procedure.bodySite ?? undefined. El display de un coding debería ser el nombre del procedimiento (ej. "Masoterapia"), no el segmento anatómico.
Por qué es problema: El mapper de lectura (procedure.mapper.ts) no usa el campo display del coding para construir el nombre del procedimiento — usa el code para lookupear el display. Sin embargo, semánticamente el FHIR generado es incorrecto y podría causar confusión en auditorías o integraciones futuras.
Impacto: Datos FHIR malformados semánticamente. El display del Procedure coding dice "miembro inferior" en lugar de "Masoterapia".
Recomendación: El display del coding debe ser el nombre legible del procedimiento, que ya existe en el mapper de lectura como el valor que se deriva del código. Se puede obtener de PROCEDURE_CODES_BY_CATEGORY o de un mapa code → display extraído del mapper de lectura.

3.3 El cambio de categoría en el selector de procedimientos setea el código a undefined
Severidad: Alta
Ubicación: app/patients/[id]/encounters/[encounterId]/components/FinalizeEncounterForm/index.tsx
Observación: Al cambiar la categoría de un procedimiento, el código se reinicia con setValue(\procedures.${index}.code`, undefined). El tipo ProcedureCodeno aceptaundefined, y el schema Zod z.enum(ProcedureCodeValues)rechazará el formulario al submit. **Por qué es problema:** El usuario puede cambiar la categoría y hacer submit sin seleccionar un nuevo código, recibiendo un error de validación genérico. Además,setValueconundefinedpara un campo tipado como enum podría causar comportamientos inconsistentes conreact-hook-form. **Impacto:** Bug funcional: formulario no submitteable después de cambiar categoría sin seleccionar código manualmente. **Recomendación:** Al cambiar categoría, resetear el código al primer valor del nuevo set de códigos para esa categoría, usando PROCEDURE_CODES_BY_CATEGORY[newCategory][0]`.

3.4 El mapper de escritura de Encounter retorna el tipo de lectura FhirEncounter
Severidad: Media
Ubicación: infrastructure/fhir/mappers/encounter.write.mapper.ts
Observación: La función mapToFhirEncounter retorna FhirEncounter (el tipo inferido del schema Zod de lectura). El retorno se construye como unknown as FhirEncounter. El recurso enviado al servidor tiene campos (status: "planned", class, etc.) que no están en el schema de lectura fhirEncounterSchema tal como está definido.
Por qué es problema: El tipo de retorno de un write mapper debería ser unknown o un tipo de escritura específico (FHIR write object), no el tipo de lectura. Usar el tipo de lectura como tipo de escritura es semánticamente incorrecto y puede enmascarar campos faltantes o extras.
Impacto: Confusión en mantenimiento. Un desarrollador que vea que mapToFhirEncounter retorna FhirEncounter podría asumir que puede pasar ese objeto al mapper de lectura, lo cual es incorrecto.
Recomendación: Cambiar el tipo de retorno del write mapper a unknown o a un tipo genérico de payload FHIR. El repositorio puede castear según necesite al llamar al cliente.

3.5 Validación de periodEnd > periodStart llega al usuario como error de dominio tardío
Severidad: Media
Ubicación: app/patients/[id]/encounters/[encounterId]/components/FinalizeEncounterForm/finalize-encounter-form.schema.ts y domain/shared/domain-rules.validator.ts
Observación: El schema Zod del formulario no valida que periodEnd sea posterior a periodStart. Esta validación solo ocurre en validateFinalizeEncounterRules (Layer 2), lo que requiere un roundtrip al servidor para informar al usuario.
Por qué es problema: Según la arquitectura definida, el schema Zod puede usar superRefine para validaciones de coherencia local entre campos. El periodStart se pasa como prop al formulario cliente, por lo que está disponible para validación local.
Impacto: UX degradada: el profesional completa todo el formulario, hace submit, y recibe un error del servidor para una validación que podría resolverse instantáneamente en el cliente.
Recomendación: Pasar periodStart como contexto al schema Zod (usando un factory de schema que cierre sobre periodStart), o añadir una validación superRefine en el schema que compare periodEnd contra el valor del prop periodStart accesible via closure.

3.6 FinalizeEncounterInput no incluye visitType — información necesaria para el mapper
Severidad: Alta (relacionada con hallazgo 3.1)
Ubicación: domain/encounters/encounter.write-input.ts
Observación: FinalizeEncounterInput no tiene el campo visitType. El mapper mapToFhirEncounterUpdate tampoco puede incluir el tipo de visita en el PUT porque no tiene esa información disponible.
Por qué es problema: Es el origen del problema crítico 3.1. El diseño del write input omitió un campo necesario para una actualización completa del recurso.
Impacto: Sin visitType en el input de finalización, el mapper no puede preservar la clasificación de la visita al hacer el PUT.
Recomendación: Agregar visitType: EncounterVisitType a FinalizeEncounterInput. El Server Action ya conoce el encounter (lo fetcha para verificar status), por lo que puede incluir encounter.visitType en el input de finalización.

3.7 No existe validación de dominio para la nota clínica en CreateEncounterInput
Severidad: Baja
Ubicación: domain/shared/domain-rules.validator.ts, validateEncounterRules
Observación: La regla que verifica que la nota no sea solo espacios en blanco (input.note.trim() === "") está duplicada: ya existe en el schema Zod del formulario como refine. La validación de dominio repite trabajo del Layer 1.
Por qué es problema: Viola el principio de separación de capas de validación definido en copilot_instructions.md. El Layer 1 (Zod) cubre sintaxis y formato. El Layer 2 (domain rules) cubre coherencia clínica y referencias. Una nota vacía es una violación de formato, no una regla clínica.
Impacto: Duplicación de lógica. Si cambia la regla en el schema, hay que recordar actualizarla también en el validador de dominio.
Recomendación: Eliminar la validación de nota vacía del validador de dominio. Mantenerla solo en el schema Zod. Agregar al validador de dominio únicamente reglas que requieran contexto clínico (por ejemplo: "si visitType es discharge, la nota es obligatoria").

3.8 FinalizeEncounterForm no tiene sección de evaluaciones clínicas para visitas iniciales
Severidad: Alta
Ubicación: app/patients/[id]/encounters/[encounterId]/components/FinalizeEncounterForm/index.tsx
Observación: El formulario de finalización captura signos vitales, EVA y procedimientos, pero no tiene campos para Barthel, ECOG ni NECPAL. Para una visita de tipo initial o re-assessment, estas evaluaciones son clínicamente obligatorias según el modelo de datos del dominio.
Por qué es problema: El Phase 4 del write plan cubre assessments, pero sin él, la UI permite finalizar una visita inicial sin ninguna evaluación funcional. El sistema queda clínicamente incompleto para las visitas más críticas.
Impacto: Datos clínicos incompletos. La InitialEvaluationSection y ReAssessmentSection en el perfil del paciente quedarán vacías aunque la visita fue finalizada.
Recomendación: Priorizar Phase 4 del write plan, o al menos mostrar un aviso contextual en el formulario cuando visitType === "initial" o "re-assessment" indicando que las evaluaciones Barthel, ECOG y NECPAL deben registrarse.

4. Desalineaciones entre Arquitectura Documentada y Real
4.1 phase-1-implementation-plan.md contiene código TypeScript, no documentación
Severidad: Alta
Ubicación: /phase-1-implementation-plan.md
Observación: El archivo contiene una implementación de Server Action con "use server", imports de módulos del proyecto, lógica de validación y llamadas a repositorios. No es un plan de implementación sino código fuente colocado en un archivo .md.
Por qué es problema: Puede confundir a colaboradores, herramientas de CI que scanneen docs, o a GitHub Copilot si lo usa como contexto de documentación. El código en un .md no recibe revisión ni tipado.
Impacto: Confusión documental. El código no es ejecutable desde su ubicación actual.
Recomendación: Determinar si este archivo es un borrador de la implementación real o documentación de referencia. Si es el primero, mover el contenido al path correcto (app/.../actions/). Si es el segundo, reemplazar el código por pseudocódigo o descripciones en texto.

4.2 EncounterFhirRepository.finalize() orquesta múltiples recursos — debería ser un Application Service
Severidad: Media
Ubicación: infrastructure/fhir/repositories/encounter.fhir-repository.ts, domain/encounters/encounter.repository.ts
Observación: El método finalize() en el repositorio compone un bundle con un Encounter (PUT), N Observations (POST) y N Procedures (POST). Según la arquitectura hexagonal estándar, esta orquestación multi-recurso pertenece a una capa de Application Service, no a un repositorio de dominio.
Por qué es problema: El repositorio de Encounter ahora tiene dependencia transitiva en los mappers de VitalSign, EVA y Procedure. Viola el principio de responsabilidad única.
Impacto: Reconocido como deuda técnica en write-phase-architecture.md (sección 11). El riesgo crece a medida que se agregan más recursos al bundle.
Recomendación: Es aceptable como simplificación para el learning lab, pero documentar explícitamente en el código (no solo en el .md) que este es un trade-off deliberado. Si el proyecto crece, extraer un FinalizeEncounterUseCase o EncounterService como capa intermedia.

4.3 app/patients/[id]/encounters/page.tsx no sigue el patrón data.ts
Severidad: Media
Ubicación: app/patients/[id]/encounters/page.tsx
Observación: La página de encuentros instancia 9 repositorios y orquesta múltiples Promise.all directamente en el componente. La página de detalle del paciente delega esto a getPatientDetailData() en data.ts.
Por qué es problema: Inconsistencia de patrón dentro del mismo módulo app/patients/[id]/. El patrón data.ts existe precisamente para separar la orquestación de datos del layout.
Impacto: La página de encuentros es más difícil de testear, mantener y refactorizar.
Recomendación: Crear app/patients/[id]/encounters/data.ts con una función getEncountersPageData(patientId: string).

5. Problemas de UX del Lifecycle de Encounter
5.1 No existe transición explícita de planned a in-progress
Severidad: Media
Observación: El formulario de finalización se muestra cuando el encounter tiene status planned o in-progress, pero no hay ninguna acción en la UI para cambiar de planned a in-progress. En la práctica, el kinesiólogo "inicia" la visita llenando el formulario y finalizándola directamente.
Por qué es problema: El lifecycle clínico real requiere marcar el momento en que comienza la atención (periodStart activo) vs. cuando se planifica. El sistema actual no captura ese momento.
Impacto: durationMinutes en el Encounter se calculará incorrectamente si periodStart viene de la planificación y periodEnd de la finalización.
Recomendación: Reconocido como deuda técnica (Phase 5). Mientras tanto, el formulario de finalización debería calcular durationMinutes y mostrarlo al profesional como confirmación antes de enviar.

5.2 No hay forma de cancelar o eliminar un encuentro planificado
Severidad: Media
Observación: Una vez creado un encuentro planificado, la UI no ofrece opción de cancelarlo. No hay botón de cancelación en la página de detalle del encuentro (/encounters/[encounterId]).
Por qué es problema: En la práctica clínica, las visitas se cancelan frecuentemente. Sin esta funcionalidad, los encuentros cancelados se acumulan como "Próximas sesiones" en la lista.
Impacto: La lista de "Próximas sesiones" puede mostrar visitas obsoletas que nunca se realizaron.
Recomendación: Agregar una acción de cancelación en EncounterDetailPage cuando el status es planned. Requiere un Server Action que haga PATCH o PUT del status a cancelled y revalide las rutas correspondientes.

5.3 La lista de encuentros muestra solo la primera visita planificada
Severidad: Baja
Ubicación: app/patients/[id]/encounters/components/EncounterList.tsx
Observación: EncounterList renderiza solo la primera visita planificada (la más cercana) y muestra "+ N sesiones programadas" para el resto. Si hay 3 visitas planificadas futuras, solo se ve la primera.
Por qué es problema: El profesional no puede ver ni gestionar todas sus visitas planificadas desde esta vista.
Impacto: Para ver el resto de las visitas planificadas no hay ningún camino — están ocultas sin enlace o expansión.
Recomendación: Agregar un botón de expansión para mostrar todas las sesiones planificadas, o un enlace a una vista filtrada.

5.4 Las visitas planificadas y finalizadas se muestran en dos lugares distintos con lógica diferente
Severidad: Media
Observación: En el perfil del paciente (/patients/[id]), el componente LastEncounterSection muestra "ÚLTIMA VISITA" y "PRÓXIMA VISITA" usando findLastByPatientIdAndPractitionerId y findNextPlannedByPatientIdAndPractitionerId — queries que filtran por practitionerId. En la página de encuentros (/patients/[id]/encounters), se muestran todos los encuentros del episodio sin filtrar por practitioner.
Por qué es problema: El profesional puede ver diferentes encounters en el perfil vs. en la lista de encuentros. Si un colega cargó datos, el perfil los omite pero la lista los incluye.
Impacto: Inconsistencia de información entre dos vistas del mismo paciente.
Recomendación: Definir si el filtro por practitioner es intencional en el perfil o es una simplificación técnica. Documentarlo explícitamente.

6. Top 10 Prioridades
#HallazgoSeveridadImpacto1mapToFhirEncounterUpdate no preserva type (visitType se pierde al finalizar)CríticaCorrupción de datos clínicos en producción2FinalizeEncounterInput no incluye visitType (causa raíz del #1)CríticaBloqueante para el fix del #13mapToFhirProcedures usa bodySite como display del codingAltaDatos FHIR semánticamente incorrectos4Bug: cambio de categoría de procedimiento setea código a undefinedAltaFormulario no submitteable después de cambiar categoría5FinalizeEncounterForm muestra IDs internos al usuarioAltaFriccción UX severa, fuga de capa de infraestructura6Página de detalle de encounter finalizado no muestra datos clínicosAltaNo hay deep link funcional para revisar visitas pasadas7Sin formulario de assessments (Barthel, ECOG, NECPAL) en visitas inicialesAltaDatos clínicos críticos no capturables desde UI8phase-1-implementation-plan.md contiene código fuente, no documentaciónAltaConfusión documental y de tooling9Validación periodEnd > periodStart requiere roundtrip al servidorMediaUX degradada para validación evitable10encounters/page.tsx sin abstracción data.ts — inconsistencia de patrónMediaMantenibilidad y consistencia del codebase

7. Roadmap Corto por Fases
Fase A — Integridad de datos (1–2 días)
Objetivo: Asegurar que los datos escritos a FHIR son clínicamente correctos.
Incluye: Fix de mapToFhirEncounterUpdate para preservar type coding, agregar visitType a FinalizeEncounterInput, corregir display en mapToFhirProcedures, corregir el reset de código en el selector de procedimientos.

Fase B — UX del formulario de finalización (2–3 días)
Objetivo: El formulario de finalización debe ser usable por un profesional de salud.
Incluye: Eliminar IDs internos y mostrar nombre de paciente y fechas formateadas, labels legibles en los dropdowns de procedimientos, EVA visible por defecto, validación client-side de periodEnd > periodStart.

Fase C — Detalle de encuentro finalizado (1–2 días)
Objetivo: La URL /encounters/[encounterId] debe ser la fuente de verdad para un encuentro.
Incluye: Cargar y mostrar vitals, procedimientos y EVA en la rama read-only de EncounterDetailPage.

Fase D — Gaps del lifecycle (2–3 días)
Objetivo: Completar el ciclo de vida de una visita.
Incluye: Acción de cancelación de encounter planificado, mostrar todas las visitas planificadas en EncounterList, aviso contextual cuando visitType === "initial" y no hay assessments capturados.

Fase E — Consistencia arquitectural (1 día)
Objetivo: Alinear el código con los patrones establecidos.
Incluye: Extraer data.ts para encounters/page.tsx, limpiar phase-1-implementation-plan.md, eliminar la validación duplicada de nota en el domain rules validator.

8. Preguntas Abiertas
Q1 — Lifecycle clínico real: ¿El kinesiólogo inicia y finaliza la visita en el mismo momento (al terminar), o necesita marcar el inicio cuando llega al domicilio? Esto determina si periodStart del Encounter debería actualizarse al iniciar (Phase 5) o si puede quedar como la fecha planificada.
Q2 — Filtro por practitionerId en el perfil del paciente: ¿La LastEncounterSection en /patients/[id] está diseñada para mostrar solo las visitas del profesional autenticado, o debería mostrar la última visita de cualquier profesional? El comportamiento actual es inconsistente con la lista de encuentros.
Q3 — Phase 4 (assessments write): ¿El Phase 4 está planeado para el próximo sprint? Si no, ¿qué hacer cuando una visita inicial se finaliza sin Barthel/ECOG/NECPAL? ¿Validación bloqueante, aviso, o silencio?
Q4 — Cancelación de encuentros: ¿La cancelación de un encuentro planificado debe notificar al sistema externo, o es una operación puramente local (PATCH status a cancelled)?
Q5 — Múltiples practicantes: El modelo actual asume un único CURRENT_PRACTITIONER_ID por instancia. ¿Está planificado soporte multi-practitioner? Si es así, la query de findLastByPatientIdAndPractitionerId y el filtro en el perfil necesitarán revisión.
Q6 — Read-only de Encounter para otros practicantes: Si un profesional abre /encounters/[encounterId] de una visita registrada por un colega, ¿debe ver el formulario de finalización o solo la vista de solo lectura? Actualmente solo se verifica encounter.status, no quién es el performer.
Q7 — phase-1-implementation-plan.md: ¿Este archivo es el borrador original de la implementación que quedó sin limpiar, o es documentación intencional que debe existir como referencia? Define el curso de acción: mover o reescribir.