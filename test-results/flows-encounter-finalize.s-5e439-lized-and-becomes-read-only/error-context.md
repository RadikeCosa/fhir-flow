# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: flows/encounter-finalize.seeded.spec.ts >> encounter finalize flow (seeded baseline) >> in-progress encounter can be finalized and becomes read-only
- Location: e2e/flows/encounter-finalize.seeded.spec.ts:29:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Esta visita está finalizada y no puede editarse')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Esta visita está finalizada y no puede editarse')

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - banner [ref=e2]:
    - link "Ir al contenido principal" [ref=e3] [cursor=pointer]:
      - /url: "#main-content"
    - generic [ref=e4]:
      - link "Ir al inicio" [ref=e5] [cursor=pointer]:
        - /url: /
        - text: Fhir Flow
      - navigation "Navegación principal" [ref=e7]:
        - link "Pacientes" [ref=e8] [cursor=pointer]:
          - /url: /patients
  - main [ref=e9]:
    - generic [ref=e11]:
      - navigation "Navegación de ubicación" [ref=e12]:
        - list [ref=e13]:
          - listitem [ref=e14]:
            - link "Pacientes" [ref=e15] [cursor=pointer]:
              - /url: /patients
            - generic [ref=e16]: ›
          - listitem [ref=e17]:
            - link "Paciente E2E Finalize" [ref=e18] [cursor=pointer]:
              - /url: /patients/e2e-finalize-patient-1
            - generic [ref=e19]: ›
          - listitem [ref=e20]:
            - generic [ref=e21]: Encuentros
      - generic [ref=e22]:
        - generic [ref=e23]:
          - heading "Visita de seguimiento" [level=1] [ref=e24]
          - paragraph [ref=e25]: "Paciente: Paciente E2E Finalize"
        - link "← Volver" [ref=e26] [cursor=pointer]:
          - /url: /patients/e2e-finalize-patient-1/encounters
      - generic [ref=e27]:
        - generic [ref=e28]:
          - heading "Resumen de la visita" [level=2] [ref=e29]
          - generic [ref=e30]:
            - generic [ref=e31]:
              - term [ref=e32]: Estado
              - definition [ref=e33]: in-progress
            - generic [ref=e34]:
              - term [ref=e35]: Tipo de visita
              - definition [ref=e36]: Visita de seguimiento
            - generic [ref=e37]:
              - term [ref=e38]: Inicio real (referencia)
              - definition [ref=e39]: 01/04/2026, 07:00 a. m.
        - generic [ref=e40]:
          - generic [ref=e41]:
            - heading "Finalizar visita" [level=2] [ref=e42]
            - paragraph [ref=e43]: Completa los datos para registrar el cierre clínico.
          - generic [ref=e45]:
            - generic [ref=e47]:
              - generic [ref=e48]: "Profesional: Kine Finalize E2E"
              - generic [ref=e49]: "Agenda planificada: Sin fecha planificada"
            - generic [ref=e50]:
              - generic [ref=e51]:
                - heading "Datos del cierre" [level=2] [ref=e52]
                - group "Ejecución real de la visita" [ref=e53]:
                  - generic [ref=e54]: Ejecución real de la visita
                  - paragraph [ref=e55]: Registrá fecha y horario real en formato 24 horas.
                  - generic [ref=e56]:
                    - generic [ref=e57]:
                      - generic [ref=e58]: Fecha real
                      - textbox "Fecha real" [ref=e59]: 2026-04-01
                    - generic [ref=e60]:
                      - generic [ref=e61]: Hora real de inicio
                      - textbox "Hora real de inicio" [ref=e62]: 10:00
                    - generic [ref=e63]:
                      - generic [ref=e64]: Hora real de fin
                      - textbox "Hora real de fin" [ref=e65]: 11:00
                - generic [ref=e66]:
                  - generic [ref=e67]: Nota clínica *
                  - textbox "Nota clínica *" [ref=e68]: E2E finalize clinical note
                - generic [ref=e69]:
                  - generic [ref=e70]: Motivo de la visita
                  - textbox "Motivo de la visita" [ref=e71]: Escenario determinístico e2e finalize
                - generic [ref=e72]:
                  - paragraph [ref=e73]: Profesional
                  - paragraph [ref=e74]: Kine Finalize E2E
              - generic [ref=e75]:
                - button "Signos vitales ▲" [ref=e76]
                - generic [ref=e77]:
                  - generic [ref=e78]:
                    - generic [ref=e79]:
                      - generic [ref=e80]: Frecuencia cardíaca (lpm)
                      - spinbutton "Frecuencia cardíaca (lpm)" [active] [ref=e81]
                      - paragraph [ref=e82]: "Rango clínico: 30-220 lpm"
                    - generic [ref=e83]:
                      - generic [ref=e84]: Frecuencia respiratoria (rpm)
                      - spinbutton "Frecuencia respiratoria (rpm)" [ref=e85]
                      - paragraph [ref=e86]: "Rango clínico: 5-60 rpm"
                  - generic [ref=e87]:
                    - generic [ref=e88]:
                      - generic [ref=e89]: Saturación oxígeno (%)
                      - spinbutton "Saturación oxígeno (%)" [ref=e90]
                      - paragraph [ref=e91]: "Rango clínico: 0-100 %"
                    - generic [ref=e92]:
                      - generic [ref=e93]: Temperatura corporal (°C)
                      - spinbutton "Temperatura corporal (°C)" [ref=e94]
                      - paragraph [ref=e95]: "Rango clínico: 30.0-43.0 °C"
                  - generic [ref=e96]:
                    - paragraph [ref=e97]: Tensión arterial (mmHg)
                    - generic [ref=e98]:
                      - generic [ref=e99]:
                        - generic [ref=e100]: Presión sistólica (mmHg)
                        - spinbutton "Presión sistólica (mmHg)" [ref=e101]
                        - paragraph [ref=e102]: "Rango clínico: 60-260 mmHg"
                      - generic [ref=e103]:
                        - generic [ref=e104]: Presión diastólica (mmHg)
                        - spinbutton "Presión diastólica (mmHg)" [ref=e105]
                        - paragraph [ref=e106]: "Rango clínico: 30-150 mmHg"
              - generic [ref=e107]:
                - button "EVA ▲" [ref=e108]
                - generic [ref=e109]:
                  - generic [ref=e110]: Puntuación EVA
                  - spinbutton "Puntuación EVA" [ref=e111]
                  - paragraph [ref=e112]: 0 = sin dolor · 10 = peor dolor imaginable
                  - paragraph [ref=e113]: "Invalid input: expected number, received undefined"
              - generic [ref=e114]:
                - button "Procedimientos ▲" [ref=e115]
                - generic [ref=e116]:
                  - generic [ref=e117]: No hay procedimientos cargados. Podés agregar uno desde esta sección.
                  - button "Agregar procedimiento" [ref=e118]
              - generic [ref=e119]:
                - button "Guardar progreso" [ref=e120]
                - button "Finalizar visita" [ref=e121]
  - contentinfo [ref=e122]:
    - paragraph [ref=e123]: FhirFlow · FHIR R4 · Proyecto de aprendizaje
  - button "Open Next.js Dev Tools" [ref=e129] [cursor=pointer]:
    - img [ref=e130]
  - alert [ref=e133]
```

# Test source

```ts
  1  | import { expect, test, type Page } from "@playwright/test";
  2  | import { loadFinalizeMinimalSeed } from "../support/load-finalize-minimal-seed";
  3  | 
  4  | const PATIENT_ID = "e2e-finalize-patient-1";
  5  | const ENCOUNTER_ID = "e2e-finalize-encounter-1";
  6  | const ENCOUNTER_URL = `/patients/${PATIENT_ID}/encounters/${ENCOUNTER_ID}`;
  7  | const PATIENT_URL = `/patients/${PATIENT_ID}`;
  8  | 
  9  | async function finalizeSeededEncounter(page: Page, clinicalNoteSentinel: string) {
  10 |   await page.goto(ENCOUNTER_URL);
  11 |   await page.waitForLoadState("networkidle");
  12 | 
  13 |   await expect(page.getByRole("button", { name: "Guardar progreso" })).toBeVisible();
  14 |   await expect(page.getByRole("button", { name: "Finalizar visita" })).toBeVisible();
  15 | 
  16 |   await page.getByLabel("Fecha real").fill("2026-04-01");
  17 |   await page.getByLabel("Hora real de inicio").fill("10:00");
  18 |   await page.getByLabel("Hora real de fin").fill("11:00");
  19 |   await page.getByLabel("Nota clínica *").fill(clinicalNoteSentinel);
  20 | 
  21 |   await page.getByRole("button", { name: "Finalizar visita" }).click();
  22 | }
  23 | 
  24 | test.describe("encounter finalize flow (seeded baseline)", () => {
  25 |   test.beforeEach(async () => {
  26 |     await loadFinalizeMinimalSeed();
  27 |   });
  28 | 
  29 |   test("in-progress encounter can be finalized and becomes read-only", async ({ page }) => {
  30 |     const clinicalNoteSentinel = "E2E finalize clinical note";
  31 | 
  32 |     await finalizeSeededEncounter(page, clinicalNoteSentinel);
  33 | 
  34 |     await expect(
  35 |       page.getByText("Esta visita está finalizada y no puede editarse"),
> 36 |     ).toBeVisible();
     |       ^ Error: expect(locator).toBeVisible() failed
  37 |     await expect(page.getByRole("button", { name: "Guardar progreso" })).toHaveCount(0);
  38 |     await expect(page.getByRole("button", { name: "Finalizar visita" })).toHaveCount(0);
  39 |     await expect(page.getByText(clinicalNoteSentinel)).toBeVisible();
  40 |   });
  41 | 
  42 |   test("after finalize, patient detail switches to finished encounter as clinical source", async ({ page }) => {
  43 |     const clinicalNoteSentinel = "E2E finalize note for patient detail";
  44 | 
  45 |     await finalizeSeededEncounter(page, clinicalNoteSentinel);
  46 | 
  47 |     await expect(
  48 |       page.getByText("Esta visita está finalizada y no puede editarse"),
  49 |     ).toBeVisible();
  50 | 
  51 |     await page.goto(PATIENT_URL);
  52 |     await page.waitForLoadState("networkidle");
  53 | 
  54 |     await expect(page.getByRole("button", { name: "Completar visita" })).toHaveCount(0);
  55 |     await expect(page.getByText("ÚLTIMA VISITA")).toBeVisible();
  56 |     await expect(page.getByText(clinicalNoteSentinel)).toBeVisible();
  57 |   });
  58 | });
  59 | 
```