> **Nota:** Este documento es una revisión histórica. No refleja necesariamente el estado actual del sistema. Ver [`guia-rapida.md`](../../guia-rapida.md) para navegar la documentación vigente.

> **Nota de revisión histórica**
> 
> Este documento es un informe de revisión puntual (artefacto de evaluación), no una fuente de verdad operativa ni técnica.
> La documentación de autoridad actual está en `docs/adr/ADR-001-encounter-lifecycle-and-write-architecture.md`, `docs/write-phase-architecture.md`, y `docs/validation/validacion-arquitectonica.md`.
> 
Informe de revisión arquitectónica y de UX
1) Resumen ejecutivo
Diagnóstico general

La base arquitectónica está bien encaminada en cuatro criterios clave:

    La UI trabaja mayormente con modelos de dominio, no con recursos FHIR crudos. Las páginas y componentes consumen Encounter, Procedure, VitalSignRecord, EvaAssessment, etc., y los repositorios de infraestructura devuelven dominio, no JSON FHIR.

    El acceso HTTP está efectivamente concentrado en lib/fhir/fhir-client.ts; no encontré fetch en app/, y el fetch real vive en el cliente FHIR.

    La validación de forma y la validación de reglas de dominio están separadas en el write flow.

    La infraestructura write está fuera de la UI y usa mappers inversos + repositorios + cliente FHIR.

Problemas principales

Dicho eso, hay desalineaciones importantes entre la arquitectura documentada y la implementación real:

    El lifecycle clínico de Encounter está colapsado en “planificar” y “finalizar”, sin paso explícito de inicio / in-progress. La UI y el write flow permiten saltar de planned a finished en una sola pantalla.

    La pantalla de detalle de encuentro no cumple con el contrato documentado para encuentros finalizados: muestra solo un resumen textual y no renderiza en modo read-only los signos vitales, EVA y procedimientos guardados.

    La continuidad de UX es débil: desde /patients/[id] y desde el historial, la visita planificada próxima no tiene CTA para continuar, y en el historial solo se muestra la primera visita planificada; el resto queda oculto detrás de un contador.

    Hay varios problemas de write flow que pueden romper consistencia clínica o persistencia: falta de verificación servidor de relación patientId–episodeOfCareId, create flow sin performerId en dominio, y Procedure write mapper con shape incorrecto para bodySite y sin timestamp clínico propio.

Veredicto

Arquitectura read/UI: razonablemente sólida.
Arquitectura write/lifecycle clínico: funcional pero incompleta y con drift importante respecto del diseño esperado.
2) Hallazgos de UI
UI-1 — El entry point real no coincide con la arquitectura documentada

    Severidad: Media.

    Ubicación: docs/write-phase-architecture.md, app/patients/[id]/page.tsx, app/patients/components/detail/EpisodeOfCareSection.tsx.

    Observación: La documentación dice que el botón “Plan visit” vive dentro de la sección de EpisodeOfCare, pero en la implementación real el CTA “Planificar Visita” se renderiza arriba del todo en el header del detalle del paciente, mientras que EpisodeOfCareSection solo muestra datos del episodio y un link al historial.

    Por qué es problema: Esto rompe la consistencia entre arquitectura documentada, navegación real y responsabilidad visual. También diluye el contexto clínico: la acción de planificar deja de estar anclada al episodio activo que le da sentido.

    Impacto: Más costo de mantenimiento, más ambigüedad para futuros cambios, y riesgo de duplicar lógica de elegibilidad del CTA.

    Recomendación concreta: Mover el CTA al bloque de EpisodeOfCareSection o actualizar explícitamente la documentación para reflejar el diseño vigente. Elegir una sola fuente de verdad.

UI-2 — La continuidad de la visita planificada es pobre

    Severidad: Alta.

    Ubicación: app/patients/components/detail/LastEncounterSection.tsx, app/patients/[id]/encounters/components/EncounterList.tsx, app/patients/[id]/encounters/components/EncounterCard.tsx.

    Observación: La “PRÓXIMA VISITA” se muestra como resumen, pero no tiene CTA para “Abrir”, “Continuar” o “Registrar datos”. En el historial, solo se renderiza la primera sesión planificada; las demás quedan ocultas en un texto “+ N sesiones más programadas”. Además, EncounterCard no enlaza al detalle.

    Por qué es problema: En un flujo clínico real, una visita planificada no es solo informativa: es una tarea accionable. Si la UI no ofrece continuidad directa, el profesional pierde tiempo o directamente no encuentra cómo retomar el caso.

    Impacto: Fricción operativa alta, especialmente si hay varias visitas planificadas o si el usuario vuelve horas/días después de planificar.

    Recomendación concreta: Hacer que cada encuentro planificado tenga CTA explícito al detalle y listar todas las visitas planificadas navegables, no solo la más próxima.

UI-3 — La pantalla de encuentro finalizado no muestra los datos clínicos completos

    Severidad: Alta.

    Ubicación: docs/write-phase-architecture.md, app/patients/[id]/encounters/[encounterId]/page.tsx.

    Observación: La arquitectura documentada espera que status: "finished" renderice información del encuentro + datos clínicos en modo read-only. La implementación real solo muestra estado, tipo, período, nota clínica y motivo; no carga ni presenta signos vitales, EVA ni procedimientos.

    Por qué es problema: El detalle finalizado deja de ser una ficha clínica completa y pasa a ser un resumen administrativo. Eso contradice el propósito del detalle y obliga a reconstruir contexto desde otras pantallas.

    Impacto: Pérdida de trazabilidad clínica y mala UX post-cierre.

    Recomendación concreta: Convertir la pantalla de encuentro finalizado en la vista read-only canónica del encuentro, reutilizando los componentes ya existentes de vitales, EVA y procedimientos.

UI-4 — Los errores write no llegan bien a la UI

    Severidad: Alta.

    Ubicación: domain/shared/action-result.types.ts, app/patients/[id]/encounters/new/actions/create-encounter.action.ts, app/patients/[id]/encounters/new/components/CreateEncounterForm/index.tsx, app/patients/[id]/encounters/[encounterId]/actions/finalize-encounter.action.ts, app/patients/[id]/encounters/[encounterId]/components/FinalizeEncounterForm/index.tsx.

    Observación: Las actions devuelven details con parseResult.error.flatten(), pero los formularios solo renderizan error.message y error.code. Además, varios mensajes llegan en inglés genérico (“Invalid form data”, “Encounter not found”), en una UI que por lo demás está en español.

    Por qué es problema: Se pierde granularidad: el sistema sabe qué campo falló pero la UI no lo aprovecha. Eso obliga al usuario a adivinar.

    Impacto: Errores tardíos, menos recuperables y con peor confianza clínica.

    Recomendación concreta: Mapear details.fieldErrors a errores de campo visibles y unificar todos los mensajes de usuario en español clínico-operativo.

UI-5 — El page de historial carga demasiado en una sola pasada

    Severidad: Media.

    Ubicación: app/patients/[id]/encounters/page.tsx.

    Observación: La ruta arma un fan-out por encuentro para signos vitales, EVA, procedimientos y tres tipos de assessment, con Promise.all anidados por cada encounter.

    Por qué es problema: Aunque sigue siendo Server Component first, la página concentra demasiada orquestación y puede escalar mal en episodios largos.

    Impacto: Riesgo de latencia alta y de degradación de UX en historiales extensos.

    Recomendación concreta: Separar “resumen de historial” de “detalle completo por encuentro”, y cargar el detalle clínico bajo demanda o en una ruta/detalle específica.

3) Hallazgos del write flow
WF-1 — El create flow no modela performerId en dominio y el mapper lo inyecta desde config

    Severidad: Alta.

    Ubicación: docs/write-phase-architecture.md, domain/encounters/encounter.write-input.ts, domain/shared/domain-rules.validator.ts, app/patients/[id]/encounters/new/actions/create-encounter.action.ts, infrastructure/fhir/mappers/encounter.write.mapper.ts, lib/server/current-practitioner.ts.

    Observación: La action resuelve el profesional actual, pero solo pasa practitionerName al CreateEncounterInput. Luego el inverse mapper usa currentPractitionerId desde config, no un performerId validado dentro del input.

    Por qué es problema: El write input queda clínicamente incompleto y la responsabilidad de cerrar el contexto del performer se desplaza al mapper/config, en vez de quedar cerrada en la action.

    Impacto: Riesgo de inconsistencias entre el practitioner realmente resuelto y el que finalmente se persiste si cambia la fuente o el mecanismo de identidad.

    Recomendación concreta: Hacer que el input de creación incluya performerId y performerName, ambos resueltos y validados en la Server Action antes de llamar al repositorio.

WF-2 — La creación no revalida en servidor la relación paciente–episodio al momento de escribir

    Severidad: Alta.

    Ubicación: app/patients/[id]/encounters/new/page.tsx, app/patients/[id]/encounters/new/actions/create-encounter.action.ts, domain/shared/domain-rules.validator.ts.

    Observación: La página verifica que exista exactamente un episodio activo y pasa episodeOfCareId al formulario, pero la action no verifica que ese episodio siga activo ni que pertenezca al paciente al momento del submit. Solo valida presencia/shape.

    Por qué es problema: La validación queda dependiente de un snapshot de UI. Una pestaña vieja o un submit manipulado puede escribir sobre un episodio ya cerrado o ajeno.

    Impacto: Inconsistencia clínica y de integridad referencial.

    Recomendación concreta: Revalidar en la action que episodeOfCareId pertenece al patientId y que sigue siendo el episodio activo elegible para planificar.

WF-3 — Finalize ignora la consistencia entre patientId de la ruta y el encuentro recuperado

    Severidad: Alta.

    Ubicación: app/patients/[id]/encounters/[encounterId]/actions/finalize-encounter.action.ts.

    Observación: La action recibe patientId por ruta, pero construye el input con encounter.patientId leído desde repositorio y no compara ambos valores. Luego revalida paths usando el patientId de la URL.

    Por qué es problema: La ruta deja de ser una frontera confiable de contexto clínico. Puede haber finalize sobre un encuentro perteneciente a otro paciente sin detección temprana.

    Impacto: Riesgo de navegación inconsistente, revalidation incorrecta y potencial problema de autorización/contexto.

    Recomendación concreta: Comparar explícitamente patientId de URL con encounter.patientId y abortar si no coinciden.

WF-4 — El flujo real combina registrar datos clínicos y cerrar la visita en una sola action

    Severidad: Alta.

    Ubicación: docs/write-phase-architecture.md, app/patients/[id]/encounters/[encounterId]/page.tsx, domain/encounters/encounter.repository.ts, infrastructure/fhir/mappers/finalize-encounter-bundle.mapper.ts.

    Observación: La arquitectura documentada describe fases separadas: registrar vitales, procedimientos, assessments y luego cerrar. La implementación actual ofrece una sola UI “Finalizar visita” que arma un bundle con update del Encounter + Observations + Procedures al mismo tiempo.

    Por qué es problema: Se pierde granularidad operativa y se hace imposible soportar workflows reales donde parte de los datos se registran durante la atención y el cierre ocurre después.

    Impacto: UX rígida, más riesgo de abandono de formulario y menor trazabilidad temporal.

    Recomendación concreta: Separar conceptualmente “registrar datos” de “cerrar visita”, aunque internamente se reutilicen mappers/repositorios.

WF-5 — El finalize flow no tiene transición explícita a in-progress

    Severidad: Alta.

    Ubicación: domain/encounters/encounter.ts, app/patients/[id]/encounters/[encounterId]/page.tsx, infrastructure/fhir/mappers/encounter.finalize.mapper.ts.

    Observación: El dominio contempla in-progress, y la pantalla editable acepta tanto planned como in-progress, pero no existe un write path que lleve explícitamente a ese estado. La persistencia relevante que sí existe salta directo a finished.

    Por qué es problema: El lifecycle clínico queda incompleto. “Iniciar visita” y “finalizar visita” son momentos distintos desde el punto de vista asistencial.

    Impacto: Menor fidelidad clínica y más dificultad para evolucionar a workflows reales.

    Recomendación concreta: Introducir una transición explícita planned → in-progress y reservar finished para cierre efectivo.

WF-6 — Hay mismatch entre validación de formulario y reglas de dominio en finalize

    Severidad: Media.

    Ubicación: app/patients/[id]/encounters/[encounterId]/components/FinalizeEncounterForm/index.tsx, app/patients/[id]/encounters/[encounterId]/components/FinalizeEncounterForm/finalize-encounter-form.schema.ts, domain/shared/domain-rules.validator.ts.

    Observación: El formulario presenta la nota clínica como si fuera opcional, y el Zod schema también la permite vacía; pero la validación de dominio luego la exige como obligatoria.

    Por qué es problema: El usuario recibe el rechazo demasiado tarde, después del submit.

    Impacto: Mala experiencia, errores evitables y sensación de inconsistencia de producto.

    Recomendación concreta: Alinear el contrato visible del formulario con las reglas reales del negocio. Si la nota es obligatoria para cerrar, debe verse y validarse como obligatoria antes de enviar.

WF-7 — El inverse mapper de Procedure tiene señales de persistencia incorrecta

    Severidad: Alta.

    Ubicación: infrastructure/fhir/mappers/procedure.write.mapper.ts, infrastructure/fhir/schemas/procedure.schema.ts, infrastructure/fhir/repositories/procedure.fhir-repository.ts.

    Observación: El mapper write emite bodySite como objeto simple, mientras el schema de lectura espera un array. Además, el repositorio de lectura ordena procedimientos por date, pero el write mapper no persiste un campo temporal evidente del procedimiento.

    Por qué es problema: Puede generar procedimientos que luego no validen bien al leerlos o cuya ordenación temporal sea inconsistente o dependiente del servidor.

    Impacto: Riesgo directo sobre persistencia y posterior visualización de Procedure.

    Recomendación concreta: Corregir el shape FHIR de Procedure, definir explícitamente el campo temporal clínico a persistir y asegurar compatibilidad estricta entre write mapper y read schema.

WF-8 — El write flow de errores está tipado, pero la granularidad sigue siendo insuficiente

    Severidad: Media.

    Ubicación: domain/shared/action-result.types.ts, lib/fhir/fhir-client.ts, app/patients/[id]/encounters/[encounterId]/actions/finalize-encounter.action.ts.

    Observación: La tipificación por layer está bien, y postBundle detecta entry failures, pero la action solo devuelve un error agregado de capa FHIR sin traducción por recurso o sub-operación.

    Por qué es problema: En bundles compuestos, el profesional necesita saber si falló el cierre del Encounter, un Observation o un Procedure.

    Impacto: Debugging funcional difícil y mala recuperabilidad manual.

    Recomendación concreta: Traducir los errores del bundle a mensajes clínico-operativos por recurso o subpaso.

4) Desalineaciones entre arquitectura documentada y real
D-1 — Ubicación del botón de planificar

    Severidad: Media.

    Observación: Documentado dentro de EpisodeOfCare; implementado en el header del detalle del paciente.

    Por qué es problema: Drift entre arquitectura y código.

    Impacto: Más difícil evolucionar el flujo sin reintroducir inconsistencias.

    Recomendación concreta: Alinear docs y código en una sola decisión.

D-2 — Fases separadas vs. finalize bundle monolítico

    Severidad: Alta.

    Observación: La arquitectura propone fases 2–5 como capacidades diferenciadas; la realidad junta observaciones, procedimientos, EVA y cierre en una misma action/form.

    Por qué es problema: La implementación ya no refleja el modelo mental documentado.

    Impacto: Mayor deuda de diseño y onboarding más confuso.

    Recomendación concreta: O bien re-separar el flujo real, o bien redocumentar explícitamente el cambio de estrategia.

D-3 — finished debería mostrar datos clínicos read-only y hoy no lo hace

    Severidad: Alta.

    Observación: El contrato documentado no se cumple en la pantalla de detalle.

    Por qué es problema: El detalle de encuentro queda incompleto.

    Impacto: La pantalla central del workflow pierde valor clínico.

    Recomendación concreta: Reusar componentes de lectura ya existentes dentro del detalle finalizado.

D-4 — La documentación espera un write repository que “retorne ActionResult”, pero el contrato real devuelve id/void y propaga excepciones

    Severidad: Media.

    Observación: El documento dice que el repositorio write debe retornar ActionResult, pero el contrato real devuelve { id: string } para create y void para finalize; quien traduce errores a ActionResult es la Server Action.

    Por qué es problema: La interfaz real y la arquitectura escrita dicen cosas distintas.

    Impacto: Aumenta el riesgo de implementar futuras writes con criterios distintos.

    Recomendación concreta: Unificar la convención: o ActionResult vive solo en actions, o también en repositorios, pero documentarlo sin ambigüedad.

D-5 — El ejemplo arquitectónico exige performer en rules; create real no lo valida como parte del input

    Severidad: Media.

    Observación: La arquitectura muestra performerId como parte del input validado; el create input real no lo incluye.

    Por qué es problema: La validación clínica/documental no coincide con el modelo write real.

    Impacto: Drift conceptual en un dato crítico del contexto clínico.

    Recomendación concreta: Elevar performerId al input de creación o ajustar la documentación si deliberadamente se resuelve en otra capa.

5) Problemas de UX del lifecycle de Encounter
UX-1 — Falta el paso “iniciar visita”

    Severidad: Alta.

    Observación: El sistema conoce in-progress pero no ofrece una acción clínica concreta para entrar en ese estado.

    Por qué es problema: “Planificada” no equivale a “atendida”.

    Impacto: Trazabilidad temporal deficiente.

    Recomendación concreta: Agregar una transición visible “Iniciar visita”.

UX-2 — No existe “continuar visita” desde los lugares naturales

    Severidad: Alta.

    Observación: Ni el resumen del paciente ni el historial ofrecen un CTA claro para retomar una visita planificada.

    Por qué es problema: Obliga a conocer la URL o depender del redirect inmediato post-creación.

    Impacto: Flujo frágil y poco discoverable.

    Recomendación concreta: Añadir CTAs de continuidad en ambos lugares.

UX-3 — Múltiples visitas planificadas quedan prácticamente invisibles

    Severidad: Alta.

    Observación: Solo se renderiza la primera futura; el resto se reduce a un contador textual.

    Por qué es problema: Oculta trabajo pendiente.

    Impacto: Riesgo operativo alto si se permite más de una visita planificada por episodio.

    Recomendación concreta: Mostrar todas las planificadas o permitir expandir la lista.

UX-4 — Finalizar es demasiado “todo o nada”

    Severidad: Alta.

    Observación: Registrar vitales, EVA, procedimientos y cerrar ocurren en la misma operación.

    Por qué es problema: No acompaña el trabajo real, que suele ser incremental.

    Impacto: Más abandono y más fricción.

    Recomendación concreta: Separar captura clínica de cierre.

UX-5 — El post-cierre no devuelve una ficha clínica completa

    Severidad: Alta.

    Observación: Tras cerrar, el usuario vuelve a una vista que no muestra los datos clínicos recién cargados.

    Por qué es problema: El sistema no confirma visualmente el resultado clínico del trabajo.

    Impacto: Baja confianza y necesidad de corroborar en otras pantallas.

    Recomendación concreta: Mostrar inmediatamente, en read-only, los datos persistidos del bundle.

UX-6 — Los errores relevantes aparecen tarde y de forma poco accionable

    Severidad: Media.

    Observación: Ejemplo claro: la nota clínica parece opcional, pero la regla de dominio la exige al final.

    Por qué es problema: La validación llega fuera de timing.

    Impacto: Más fricción y correcciones innecesarias.

    Recomendación concreta: Llevar a la UI temprana las reglas críticas de cierre.

6) Top 10 prioridades

    Reabrir el lifecycle de Encounter: introducir explícitamente planned → in-progress → finished.

    Hacer navegables todas las visitas planificadas con CTA “Continuar / Abrir visita”.

    Completar la vista read-only del detalle finalizado con vitales, EVA y procedimientos.

    Revalidar en Server Action la relación patientId ↔ episodeOfCareId al crear.

    Validar en finalize que el patientId de la ruta coincide con el del encuentro.

    Subir performerId al input de create y dejar de depender del config dentro del mapper.

    Alinear validación UI/domain en el formulario de cierre, sobre todo para clinicalNote.

    Corregir el write mapper de Procedure para shape FHIR y temporalidad clínica.

    Mejorar el delivery de errores a la UI usando details por campo y mensajes en español.

    Reducir fan-out del historial y separar resumen vs detalle clínico.

7) Roadmap corto por fases
Fase 1 — Alinear arquitectura y contratos

    Definir oficialmente el lifecycle esperado de Encounter.

    Decidir si el write repository devuelve ActionResult o si esa responsabilidad queda solo en Server Actions.

    Incorporar performerId al create flow y cerrar reglas de contexto mínimo.

Fase 2 — Reparar continuidad UX del flujo clínico

    Agregar CTAs claros para abrir/continuar visitas planificadas.

    Listar todas las visitas futuras navegables.

    Mover o alinear el CTA de planificar con la sección de episodio.

Fase 3 — Separar captura clínica de cierre

    Crear un paso de “iniciar visita”.

    Permitir registro incremental de vitales / EVA / procedimientos.

    Reservar finalize para el cierre real.

Fase 4 — Completar la ficha clínica final

    Hacer del detalle de encuentro finalizado la vista read-only completa.

    Confirmar visualmente lo recién persistido luego del redirect.

Fase 5 — Hardening técnico del write flow

    Revalidación server-side de contexto clínico.

    Corrección del mapper write de Procedure.

    Mejor traducción y granularidad de errores de bundle.

8) Preguntas abiertas

    ¿El producto debe permitir más de una visita planificada simultánea por episodio?
    Hoy la UI lo tolera implícitamente, pero el historial oculta las extras.

    ¿“Iniciar visita” es un hito clínico obligatorio o solo técnico?
    El dominio ya contempla in-progress, pero no existe flujo explícito para usarlo.

    ¿Se espera poder registrar datos clínicos antes del cierre?
    La arquitectura lo sugiere por fases; la implementación actual no.

    ¿La nota clínica debe ser obligatoria siempre para finalizar, o solo en ciertos tipos de visita?
    Hoy es obligatoria de hecho, pero eso no está reflejado como contrato UX temprano.

    ¿El performer debe salir de una sesión/identidad autenticada real o del env CURRENT_PRACTITIONER_ID?
    Hoy create mezcla ambos enfoques.

    ¿El detalle de encuentro finalizado debe ser la fuente de verdad clínica principal?
    Si la respuesta es sí, hoy está incompleto.

    ¿Se quiere trazabilidad temporal propia para Procedure además del vínculo al Encounter?
    Esto afecta persistencia y orden de lectura.

    ¿El route param patientId debe ser tratado como frontera de seguridad/contexto o solo de navegación?
    El finalize actual no lo impone