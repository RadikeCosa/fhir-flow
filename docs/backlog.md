📋 FHIR Flow — Backlog Reordenado
🧭 Convenciones
Track A — Lifecycle → estados de un encounter existente
Track B — Creation → cómo nace un encounter
Track C — UI/UX & Polish → mejoras visuales, experiencia y consistencia
🚀 Fase 1 — Cierre de lectura (opcional pero recomendable)
Track C — UI/UX
F2 — Ajustes visuales en encounter finished
Mejorar consistencia visual del detalle en estado finished
F3 — Limpieza de layout en detalle finished
Reducir ruido visual
Mejorar jerarquía de información
G2 — Simplificación de history list
Reducir densidad
Hacer el listado más navegable
🧱 Fase 2 — Lifecycle base (CRÍTICO)
Track A — Lifecycle
L1 — Implementar startEncounterAction
Transición: planned → in-progress
No modificar finalize
Mantener compatibilidad actual
L2 — Endurecer finalizeEncounterAction
Requerir in-progress como estado previo
Mantener fallback temporal (planned → finished)
Preparar eliminación futura del fallback
🆕 Fase 3 — Creation modes / Registrar visita
Track B — Creation
R1 — Entry point “Registrar visita”
Agregar CTA en patient dashboard
Diferenciar de “Planificar visita”
A1 — Ajustar CTAs globales
Mostrar claramente:
Planificar visita
Registrar visita
Evitar ambigüedad en acciones
R2 — Crear encounter en in-progress
Formulario permite guardado parcial
No requiere datos completos
Persistencia sin cierre
R3 — Crear encounter en finished
Permitir finalizar en el mismo flujo
Requiere datos clínicos completos
Debe respetar reglas de finalize
R4 — Unificar pipeline clínico
Evitar duplicación entre:
finalizeEncounter
register flow
Reutilizar mappers / lógica existente
🕒 Fase 4 — Temporal UX
Track C — UI/UX
K3 — Mejorar input de fecha (planificar)
Separar fecha y hora (opcional)
K5 — Manejo consistente de hora opcional
C4 — Consistencia entre create y finalize
E2 — Validación temporal (inicio < fin)
K4 — Render consistente de fechas en UI
🛠️ Fase 5 — Hardening & validaciones
Track C — UI/UX + dominio
E4 — Motivo de visita opcional
Ajuste de reglas de dominio
E6 — Paso de revisión antes de guardar
Confirmación antes de finalizar
C1 — Manejo de errores consistente
E3 — Validaciones cruzadas adicionales
C2 — Edge cases en formularios
C3 — Consistencia general de formularios
K6 — Refinamientos menores de fecha/hora
I2 — Mejoras de interacción UI
G1 — Ajustes adicionales en history
🧑‍⚕️ Fase 6 — Patient dashboard
Track C — UI/UX
B2 — Mejorar resumen de paciente
B3 — Estado actual del episodio visible
B4 — Próxima visita destacada
B1 — Accesos rápidos a acciones
A2 — Refinamiento de navegación
🧬 Fase 7 — Expansión clínica
Track futuro
M1 — Modelado adicional clínico
FUT1 — Features futuras (no definidas aún)
🧠 Cómo usar este backlog
Regla clave

👉 Nunca mezclar en el mismo bloque:

lifecycle (Track A)
creation (Track B)
Orden recomendado de trabajo real
(Opcional) F2 → F3 → G2
L1 → L2 ← foco actual
R1 → A1 → R2 → R3 → R4
Temporal UX
Hardening
Dashboard
Futuro