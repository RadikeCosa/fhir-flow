# ✅ VALIDACIÓN ARQUITECTÓNICA — Cambios v1.3

## Principio Hexagonal: ¿Se Mantiene?

### Pregunta 1: ¿FHIR cruza el límite del dominio?

**Respuesta**: ✅ NO

**Verificación:**
- Domain Rules Validator vive en `domain/shared/` — **NO importa de `infrastructure/fhir/`**
- Domain Rules Validator NO recibe FHIR resources como input
- Domain Rules Validator solo recibe tipos del dominio (`EncounterInput`, etc.)
- Inverse Mapper es quien traduce domain → FHIR, **no el validator**

**Conclusión**: Límite de dominio está protegido. ✅

---

### Pregunta 2: ¿Las 4 capas de validación tienen responsabilidades claras y distintas?

**Respuesta**: ✅ SÍ

| Capa | Responsabilidad | Input | Output | Afecta? |
|------|-----------------|-------|--------|---------|
| Form Zod | Shape/format | Raw user input | Validated data | SÍ — form validation error |
| Domain Rules | Clinical coherence | Domain type | Void (throws if invalid) | SÍ — domain rule error |
| Inverse Mapper | FHIR transformation | Domain type | FHIR resources | NO — mapper no valida |
| FHIR Client | HTTP/response validation | FHIR resources | Response or error | SÍ — FHIR error |

**Conclusión**: Cada capa sabe qué valida. No hay overlap. ✅

---

### Pregunta 3: ¿El Server Action orchesta correctamente?

**Respuesta**: ✅ SÍ

**Flujo:**
```
Server Action recibe form data
  ↓
1. Zod.parse(formData) → parseResult
   if !valid → return ActionResult { layer: "validation", ... }
  ↓
2. validateDomainRules(parseResult.data) → void
   if throws → catch DomainRuleError → return ActionResult { layer: "domain", ... }
  ↓
3. repository.create(validatedInput) → ActionResult { data: { id } }
   (mapper + fhir-client inside)
   if throws FhirWriteError → return ActionResult { layer: "fhir", ... }
  ↓
return ActionResult { success: true, data }
```

**Conclusión**: Orquestación es clara y lineal. ✅

---

### Pregunta 4: ¿Qué impide que la lógica clínica termine en otros lugares?

**Respuesta**: ✅ Forbidden Patterns + Architecture

**Mecanismos:**
1. **Sección "Forbidden Patterns"** explícitamente lista:
   - "Form schema implementing clinical rules"
   - "Inverse mapper validating rules"
   - "Domain rules validator making HTTP calls"

2. **Validación en implementación** (post-generación):
   - Server Action **DEBE llamar** validateDomainRules()
   - Si falta, el Validation Checklist lo flagea

3. **File structure** lo enforce:
   - Domain rules vive en `domain/shared/`, visible para todos
   - No está escondido en `infrastructure/` o `app/`

**Conclusión**: La lógica clínica no tiene otro lugar a dónde ir. ✅

---

## Error Handling: ¿Está Bien Tipado?

### Pregunta 5: ¿Cada tipo de error es distinguible?

**Respuesta**: ✅ SÍ

```typescript
ActionError = {
  layer: "validation" | "domain" | "fhir"  ← Distinguible
  message: string
  code?: string  ← Diferenciación adicional
  details?: unknown  ← Para contexto completo
}
```

**Ejemplos reales:**
```
{ layer: "validation", message: "Invalid datetime format", code: "FORM_VALIDATION_FAILED" }
{ layer: "domain", message: "Diastolic > systolic", code: "INVALID_VITALS" }
{ layer: "fhir", message: "Conflict: Encounter already exists", code: "FHIR_CONFLICT" }
```

**Ventajas:**
- UI puede mostrar mensajes específicos por layer
- Logging puede filtrar por layer
- Tests pueden verificar error type exacto

**Conclusión**: Error typing es exhaustivo y bien categorizado. ✅

---

## Fold Separation: ¿No Se Cruzan Schemas?

### Pregunta 6: ¿Form schema y FHIR schema se importan entre sí?

**Respuesta**: ✅ NO, está prohibido

**Reglas:**
- Form schema vive en `app/.../components/` → NO importa `infrastructure/`
- FHIR schema vive en `infrastructure/fhir/schemas/` → NO importa `app/`
- Domain rules validator importa tipos de dominio → NO importa ni form ni FHIR

**Enforcement:**
- "Forbidden Patterns" lista: "Form schema importing from FHIR infrastructure"
- Linter podría verificar esto (comentario para futuro)

**Conclusión**: Límites de Zod están separados. ✅

---

## Write Flow Completeness

### Pregunta 7: ¿Todas las fases pueden reutilizar este patrón?

**Respuesta**: ✅ SÍ

**Verificación:**

| Phase | Single/Multi | Patrón | Escalabilidad |
|-------|--------------|--------|---------------|
| 1 | Single POST | Server Action → Zod → DomainRules → Mapper → FHIR.post() | ✓ Funciona |
| 2 | Multi POST (Bundle) | Idem (pero FHIR.postBundle() en lugar de FHIR.post()) | ✓ Funciona |
| 3 | Multi POST (Bundle) | Idem | ✓ Funciona |
| 4 | Single POST | Idem | ✓ Funciona |
| 5 | Single PATCH | Idem (pero FHIR.patch() en lugar de FHIR.post()) | ✓ Funciona |

**Conclusión**: Patrón es escalable a 5 fases sin cambios arquitectónicos. ✅

---

## Technical Debt Tracking

### Pregunta 8: ¿El Technical Debt Register es completo?

**Respuesta**: ✅ SÍ, y auditable

**Items registrados:**
1. ✅ Encounter status transitions — documentado, Phase 5
2. ✅ Observations on planned Encounter — documentado, Phase 5
3. ✅ No overlap detection — documentado, TBD
4. ✅ Validator stateless — documentado, TBD
5. ✅ No rollback handling — documentado, TBD

**Por qué importa:**
- Alguien en el futuro sabrá que estas son **decisiones deliberadas**, no bugs
- Cada item tiene una "Resolution Phase", no es vago
- El register es parte de la arquitectura oficial, no escondido en PRs

**Conclusión**: Deuda técnica es explícita y auditable. ✅

---

## Backward Compatibility

### Pregunta 9: ¿Los cambios rompen la arquitectura read existente?

**Respuesta**: ✅ NO

**Por qué:**
- Read flow fue: `FHIR → Client → Zod → Mapper → Domain → UI`
- Read flow ahora: sin cambios (escrito en sección 1, pero no tocado)
- Domain Rules Validator es **solo para write**, no afecta read
- Read mappers no cambian
- Repositories siguen teniendo métodos read, ahora también tienen write

**Conclusión**: Las 4 fases de read existente siguen funcionando. ✅

---

## Documentación Coherencia

### Pregunta 10: ¿Ambos documentos dicen lo mismo en sus intersecciones?

**Respuesta**: ✅ SÍ

**Intersecciones:**

| Tema | copilot_instructions.md | write-phase-architecture.md | Coherencia |
|------|------------------------|----------------------------|-----------|
| Write flow | "Client → Server Action → Zod → Domain Rules → Repo → ..." | Sección 1 + Sección 4 | ✅ Match |
| Domain Rules | Nueva sección "Validation Architecture" | Sección 11 "Domain Rules Validator" | ✅ Complementarios |
| ActionResult | Mencionado en "Write Phase" section | Sección 5 + 5.1 | ✅ Match |
| Forbidden patterns | Links a write-phase docs | Sección 16 | ✅ Extensión, no contradicción |
| Server Action | Responsabilidades listadas | Sección 4.1 | ✅ Match |

**Conclusión**: Documentos se refuerzan mutuamente sin contradicción. ✅

---

## Tabla de Validación Final

| Aspecto | ¿Válido? | Evidencia |
|---------|----------|-----------|
| **Hexagonal boundaries** | ✅ | Domain Rules NO importa FHIR |
| **Layer separation** | ✅ | 4 capas con responsabilidades disjuntas |
| **Error typing** | ✅ | ActionError tipado por layer |
| **Zod separation** | ✅ | Form ≠ FHIR schemas, nunca se importan |
| **Flow completeness** | ✅ | 5 fases pueden usar el patrón |
| **Technical debt** | ✅ | Registrado y auditable |
| **Backward compat** | ✅ | Read flow intacto |
| **Doc coherence** | ✅ | Ambos docs alineados |

---

## ⚠️ Consideraciones Finales

### Lo que NO cambiamos (y por qué está bien)

1. **Layer flow** global — seguimos siendo hexagonal
2. **FHIR Client responsibilities** — en `lib/fhir/fhir-client.ts`
3. **Inverse Mapper como pure function** — sin cambios
4. **Read operations** — completamente intactas

### Lo que SÍ agregamos (y por qué es necesario)

1. **Domain Rules Validator** — captura lógica clínica
2. **ActionError typed** — diferencia errores por origen
3. **Technical Debt Register** — documenta simplificaciones
4. **Validation Architecture** — explícita, no implícita

### Riesgos Mitigados

| Riesgo | Mitigation |
|--------|-----------|
| Domain Rules Validator se vuelve "God class" | Tiene una sola responsabilidad: validar reglas clínicas. HTTP y DB no entran. |
| Form schema y FHIR schema se cruzan | Forbidden pattern #1. Linter podría detectarlo. |
| Errores se pierden en traducción | ActionError tipado. Cada layer tira el suyo. |
| Domain Rules Validator hace queries a BD | Forbidden pattern. Se pasa contexto desde Server Action si es necesario. |
| Overlap con Inverse Mapper validation | Mapper valida referencias ausentes (safety net). Rules valida coherencia. |

---

## ✅ VEREDICTO FINAL

**Los documentos actualizados son arquitectónicamente válidos.**

Mantienen los principios hexagonales, introducen claridad donde faltaba (validación clínica), y documentan deuda técnica de forma explícita.

Listos para pasar a **Phase 1 implementation con Copilot prompts**.

---

*Validación arquitectónica · v1.3 · APROBADO*