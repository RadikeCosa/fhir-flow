# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: flows/encounter-continuity.spec.ts >> save progress survives reload by rehydrating in-progress form
- Location: e2e/flows/encounter-continuity.spec.ts:26:5

# Error details

```
Error: expect(locator).toHaveValue(expected) failed

Locator:  getByLabel('Nota clínica *')
Expected: "E2E continuity note 1046"
Received: ""
Timeout:  5000ms

Call log:
  - Expect "toHaveValue" with timeout 5000ms
  - waiting for getByLabel('Nota clínica *')
    9 × locator resolved to <textarea id="clinicalNote" name="clinicalNote" class="mt-1 block w-full rounded-md border border-border px-3 py-2"></textarea>
      - unexpected value ""

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
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
            - link "Ricardo Aníbal Fort" [ref=e18] [cursor=pointer]:
              - /url: /patients/pac-1
            - generic [ref=e19]: ›
          - listitem [ref=e20]:
            - generic [ref=e21]: Encuentros
      - generic [ref=e22]:
        - generic [ref=e23]:
          - heading "Visita de seguimiento" [level=1] [ref=e24]
          - paragraph [ref=e25]: "Paciente: Ricardo Aníbal Fort"
        - link "← Volver" [ref=e26] [cursor=pointer]:
          - /url: /patients/pac-1/encounters
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
              - definition [ref=e39]: 01/04/2026, 10:00 a. m.
        - generic [ref=e40]:
          - generic [ref=e41]:
            - heading "Finalizar visita" [level=2] [ref=e42]
            - paragraph [ref=e43]: Completa los datos para registrar el cierre clínico.
          - generic [ref=e45]:
            - generic [ref=e47]:
              - generic [ref=e48]: "Profesional: Marty Alejandro McFly"
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
                      - textbox "Hora real de fin" [ref=e65]
                - generic [ref=e66]:
                  - generic [ref=e67]: Nota clínica *
                  - textbox "Nota clínica *" [ref=e68]
                - generic [ref=e69]:
                  - generic [ref=e70]: Motivo de la visita
                  - textbox "Motivo de la visita" [ref=e71]
                - generic [ref=e72]:
                  - paragraph [ref=e73]: Profesional
                  - paragraph [ref=e74]: Marty Alejandro McFly
              - generic [ref=e75]:
                - button "Signos vitales ▲" [ref=e76]
                - generic [ref=e77]:
                  - generic [ref=e78]:
                    - generic [ref=e79]:
                      - generic [ref=e80]: Frecuencia cardíaca (lpm)
                      - spinbutton "Frecuencia cardíaca (lpm)" [ref=e81]
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
              - generic [ref=e113]:
                - button "Procedimientos ▲" [ref=e114]
                - generic [ref=e115]:
                  - generic [ref=e116]: No hay procedimientos cargados. Podés agregar uno desde esta sección.
                  - button "Agregar procedimiento" [ref=e117]
              - generic [ref=e118]:
                - button "Guardar progreso" [ref=e119]
                - button "Finalizar visita" [ref=e120]
  - contentinfo [ref=e121]:
    - paragraph [ref=e122]: FhirFlow · FHIR R4 · Proyecto de aprendizaje
  - button "Open Next.js Dev Tools" [ref=e128] [cursor=pointer]:
    - img [ref=e129]
  - alert [ref=e132]
```

# Test source

```ts
  1  | import { expect, test, type Page } from "@playwright/test";
  2  | 
  3  | const ENCOUNTER_URL = "/patients/pac-1/encounters/1046";
  4  | 
  5  | async function ensureEncounterInProgress(page: Page) {
  6  |   await page.goto(ENCOUNTER_URL);
  7  | 
  8  |   const startButton = page.getByRole("button", { name: "Iniciar visita" });
  9  | 
  10 |   if (await startButton.isVisible()) {
  11 |     await page.getByLabel("Fecha real").fill("2026-04-01");
  12 |     await page.getByLabel("Hora real").fill("10:00");
  13 | 
  14 |     await startButton.click();
  15 |     await page.waitForLoadState("networkidle");
  16 |   }
  17 | 
  18 |   await expect(page.getByRole("heading", { name: "Finalizar visita" })).toBeVisible();
  19 |   await expect(page.getByRole("button", { name: "Guardar progreso" })).toBeVisible();
  20 | }
  21 | 
  22 | test("planned encounter can be started and becomes in-progress", async ({ page }) => {
  23 |   await ensureEncounterInProgress(page);
  24 | });
  25 | 
  26 | test("save progress survives reload by rehydrating in-progress form", async ({ page }) => {
  27 |   await ensureEncounterInProgress(page);
  28 | 
  29 |   const noteSentinel = "E2E continuity note 1046";
  30 |   const evaSentinel = "7";
  31 | 
  32 |   await page.getByLabel("Nota clínica *").fill(noteSentinel);
  33 |   await page.getByLabel("Puntuación EVA").fill(evaSentinel);
  34 | 
  35 |   await Promise.all([
  36 |     page.waitForLoadState("networkidle"),
  37 |     page.getByRole("button", { name: "Guardar progreso" }).click(),
  38 |   ]);
  39 | 
  40 |   // nuevo chequeo: estado inmediatamente después del save
  41 |   await expect(page.getByLabel("Nota clínica *")).toHaveValue(noteSentinel);
  42 |   await expect(page.getByLabel("Puntuación EVA")).toHaveValue(evaSentinel);
  43 | 
  44 |   await page.reload();
  45 |   await page.waitForLoadState("networkidle");
  46 | 
> 47 |   await expect(page.getByLabel("Nota clínica *")).toHaveValue(noteSentinel);
     |                                                   ^ Error: expect(locator).toHaveValue(expected) failed
  48 |   await expect(page.getByLabel("Puntuación EVA")).toHaveValue(evaSentinel);
  49 | });
  50 | 
```