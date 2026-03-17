# 🚀 GUÍA RÁPIDA — Usar Docs Actualizados con Copilot

## De Un Vistazo

Ahora tienes **dos documentos alineados** que funcionan como un contrato para Copilot:

```
copilot_instructions.md (global)
         ↓
write-phase-architecture.md (específico)
         ↓
Copilot prompts (con Validation Checklist)
```

---

## 📍 Dónde Buscar Información

### "¿Dónde vive Domain Rules Validator?"

**Respuesta rápida**: Sección "Validation Architecture" en `copilot_instructions.md`

**Detalle arquitectónico**: Sección 11 "Domain Rules Validator" en `write-phase-architecture.md`

---

### "¿Qué es ActionResult?"

**Respuesta rápida**: Sección "Write Phase" en `copilot_instructions.md` (tipo retornado siempre)

**Especificación completa**: Sección 5 + 5.1 en `write-phase-architecture.md` (ActionError tipado por layer)

---

### "¿Qué puedo/no puedo hacer en Server Action?"

**Respuesta rápida**: Sección 4.1 en `write-phase-architecture.md`

**Forbidden patterns**: Sección 16 en `write-phase-architecture.md`

---

### "¿Form Zod puede validar reglas clínicas?"

**Respuesta rápida**: Sección "Validation Architecture" → Layer 1 vs Layer 2 en `copilot_instructions.md`

**Detalle**: Sección 10 en `write-phase-architecture.md` — Form refine() para coherencia local, domain-rules.validator.ts para lógica clínica

---

## 🎯 Flujo para Phase 1

### 1️⃣ Lee los Documentos

- ✅ `copilot_instructions.md` — entiende "qué es qué"
- ✅ `write-phase-architecture.md` secciones 1–7 — entiende "cómo se implementa"
- ✅ `write-phase-architecture.md` sección 15 — orden de implementación

### 2️⃣ Pasa a Copilot Prompts

Cada prompt dirá:

```
Basado en:
- Section X de write-phase-architecture.md
- Validation Architecture en copilot_instructions.md

Plan:
  [arquitectónico, no código]

Archivos a crear:
  [lista de archivos]

Validation Checklist:
  [qué verificar post-generación]
```

### 3️⃣ Genera Código con Copilot

- Pega el prompt
- Genera código
- Verifica contra Validation Checklist
- Mueve archivos a proyecto

---

## 🔍 Validation Checklist Template

Cada archivo generado debe pasar este template (adaptado por fase):

```markdown
## Validation Checklist — {filename}

### Architecture Compliance
- [ ] No imports from `infrastructure/fhir/` (if domain layer)
- [ ] No imports from `app/` (if infrastructure layer)
- [ ] No `any` types used
- [ ] All errors are typed (no generic string errors)

### Domain Rules Validator Specific
- [ ] Function throws DomainRuleError on violation
- [ ] Function is pure (no HTTP, no DB calls)
- [ ] Function receives domain type (EncounterInput, not Zod.parse result)
- [ ] Error codes are specific ("MISSING_REFERENCE", not "ERROR")

### Server Action Specific
- [ ] Returns ActionResult with proper typing
- [ ] Calls validateDomainRules() after Zod.parse()
- [ ] Handles DomainRuleError with layer: "domain"
- [ ] Handles FhirWriteError with layer: "fhir"
- [ ] Never calls fetch directly

### Inverse Mapper Specific
- [ ] Function name is mapToFhir{Resource}()
- [ ] Receives domain input type (no raw form data)
- [ ] Attaches ALL mandatory references
- [ ] Sets resource status (never delegated)
- [ ] Pure function (no HTTP, no side effects)

### Zod Schema Specific
- [ ] Form schema lives in `app/.../components/{Form}/`
- [ ] No imports from `infrastructure/fhir/schemas/`
- [ ] refine() checks local coherence only (not clinical rules)
- [ ] Clinical rules go to domain-rules.validator.ts
- [ ] All error messages are user-friendly
```

---

## 📚 Index Rápido de Secciones

### copilot_instructions.md

| Para encontrar... | Ve a sección... |
|-------------------|-----------------|
| ¿Qué es hexagonal architecture? | "Layer Flow" |
| ¿Cómo valido datos? | "Validation Architecture" |
| ¿Qué reglas son no-negotiables? | "Non-Negotiable Rules" |
| ¿Cómo fluye una write? | "Write Phase" + diagram |
| ¿Qué es ActionResult? | "Write Phase" |

### write-phase-architecture.md

| Para encontrar... | Ve a sección... |
|-------------------|-----------------|
| ¿Cómo fluye write operativamente? | Sección 1 "Core Principle" |
| ¿Qué hace Server Action? | Sección 4.1 |
| ¿Qué hace Domain Rules Validator? | Sección 11 |
| ¿Qué es ActionError? | Sección 5.1 |
| ¿Dónde viven los archivos? | Sección 13 "Folder Structure" |
| ¿Cuál es el orden exacto de implementación? | Sección 15 "Implementation Order" |
| ¿Qué NO puedo hacer? | Sección 16 "Forbidden Patterns" |
| ¿Qué simplificamos? | Sección 12 "Technical Debt Register" |

---

## 💡 Ejemplos de Copilot Prompts

### ¿Cómo debería verme el prompt?

#### ❌ MALO (vago):

```
Genera un Server Action para crear un Encounter.
```

#### ✅ BUENO (específico, con refs):

```
Based on write-phase-architecture.md section 4.1 (Server Action responsibilities):

Create the server action that orchestrates:
1. Zod validation of form data
2. Domain rules validation (section 11)
3. Repository.create() call
4. Error handling per ActionError layer (section 5.1)

The action must:
- Return ActionResult<{ encounterId: string }>
- Call validateEncounterRules() from domain-rules.validator.ts
- Differentiate errors by layer (validation | domain | fhir)

File: app/patients/[id]/encounters/new/actions/create-encounter.action.ts

Validation Checklist:
- [ ] Returns ActionResult with typed error
- [ ] Calls validateDomainRules() after Zod.parse()
- [ ] Handles DomainRuleError separately from FhirWriteError
- [ ] Never calls fetch directly
```

---

## 🛠️ Cómo Alinear Copilot Prompts con Docs

### Step 1: Identifica la sección relevante

```
Voy a generar {artifact}
→ ¿Qué sección de write-phase-architecture.md lo especifica?
→ ¿Qué reglas aplican de copilot_instructions.md?
```

### Step 2: Extrae la especificación

```
Sección 4.3 (Inverse Mapper):
  - "Responsibilities:"
  - "Rules:"
→ Esto es lo que el prompt debe decir
```

### Step 3: Arma el Validation Checklist

```
De Forbidden Patterns + Responsibilities:
  - ¿Qué podría salir mal?
  - ¿Qué debería verificar después de generar?
→ Eso es el checklist
```

### Step 4: Pasa a Copilot

```
[contexto de docs]
[plan arquitectónico]
[archivo específico]
[validation checklist]
```

---

## 🎬 Workflow Completo: Phase 1

### 📋 Checklist Pre-Copilot

- [ ] Leí `copilot_instructions.md` secc. "Validation Architecture"
- [ ] Leí `write-phase-architecture.md` secc. 1–7
- [ ] Leí `write-phase-architecture.md` secc. 15 (Implementation Order)
- [ ] Leí `write-phase-architecture.md` sección 16 (Forbidden Patterns)
- [ ] Entiendo qué es ActionError y sus 3 layers

### 🚀 Orden Copilot Prompts (Phase 1)

Seguir **Sección 15: Implementation Order**:

1. **Prompt 1**: ActionResult<T> types + ActionError
2. **Prompt 2**: DomainRuleError error type
3. **Prompt 3**: EncounterInput write input type
4. **Prompt 4**: Extend EncounterRepository interface
5. **Prompt 5**: validateEncounterRules() function
6. **Prompt 6**: FHIR Client post() method
7. **Prompt 7**: mapToFhirEncounter() inverse mapper
8. **Prompt 8**: Extend EncounterFhirRepository with create()
9. **Prompt 9**: CreateEncounterAction server action
10. **Prompt 10**: CreateEncounterForm schema (Zod)
11. **Prompt 11**: CreateEncounterForm component
12. **Prompt 12**: Wire into patient detail page

### ✅ Post-Copilot

- [ ] Corri Validation Checklist para cada archivo
- [ ] Verifico que no haya `any` types
- [ ] Verifico que Domain Rules no haga HTTP
- [ ] Verifico que Form schema no importe `infrastructure/`
- [ ] Verifico que Server Action diferencie errores por layer
- [ ] Moví archivos a las carpetas especificadas (sección 13)

---

## 🤔 FAQs Rápidos

**P: ¿Por qué Domain Rules es separado de Zod?**
A: Zod valida **forma**. Domain Rules valida **semántica clínica**. Son problemas diferentes que viven en capas diferentes.

**P: ¿Y si Zod refine() puede hacer lo que Domain Rules hace?**
A: Sí, técnicamente. **Pero no deberías.** Mantienlos separados por claridad arquitectónica. Form Zod es para usuarios, Domain Rules es para lógica del negocio.

**P: ¿Dónde query a la BD para validar referencias?**
A: En el **Server Action**, antes de llamar validateDomainRules(). Pasa el contexto como parámetro al validator.

**P: ¿ActionError siempre incluye `details`?**
A: No. Es opcional. Úsalo para FHIR errors (incluye OperationOutcome). Para validation/domain errors, solo `message` es suficiente.

**P: ¿Phase 2 (vitales) seguirá exactamente el mismo patrón?**
A: Sí, excepto que usará `postBundle()` en lugar de `post()`. Todo lo demás (Domain Rules, ActionError, etc.) es idéntico.

---

## 📖 Resumen Visual

```
┌─────────────────────────────────────────────────────────────┐
│ copilot_instructions.md (v1.3)                              │
│ - Layer Flow (hexagonal)                                    │
│ - Validation Architecture (4 capas)                         │
│ - Non-Negotiable Rules                                      │
│ - Write Phase overview                                      │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ write-phase-architecture.md (v1.3)                          │
│ - Core Principle (write flow con Domain Rules)              │
│ - 4 New Actors (Server Action, Domain Rules, Mapper, Repo) │
│ - ActionResult<T> + ActionError typing                      │
│ - Domain Rules Validator specifics (section 11)             │
│ - Technical Debt Register                                   │
│ - Folder Structure (dónde vive cada archivo)                │
│ - Implementation Order (13 pasos, no 10)                    │
│ - Forbidden Patterns (16, no 10)                            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Copilot Prompts (próximo)                                   │
│ - Referencia explícita a sections                           │
│ - Plan arquitectónico (no código)                           │
│ - Validation Checklist (específico)                         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Generated Code                                              │
│ - Verificado contra Checklist                               │
│ - Ubicado en folder structure                               │
│ - Listo para Phase 2                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## ✨ Lo Que Cambió vs Antes

| Antes | Ahora |
|-------|-------|
| Validación clínica dispersa | Centralizada en domain-rules.validator.ts |
| Errores: string genéricos | ActionError tipado por layer |
| Server Action orquesta ciegamente | Server Action sabe qué capa de error es |
| Deuda técnica escondida | Technical Debt Register visible |
| Implementation order: 10 pasos | Implementation order: 13 pasos |
| Forbidden patterns: 10 | Forbidden patterns: 16 |

---

*Guía rápida · Docs v1.3 · Listo para Copilot prompts*