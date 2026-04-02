# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: flows/encounter-finalize.seeded.spec.ts >> encounter finalize flow (seeded baseline) >> in-progress encounter can be finalized and becomes read-only
- Location: e2e/flows/encounter-finalize.seeded.spec.ts:106:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Esta visita está finalizada y no puede editarse')
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
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
                      - textbox "Hora real de inicio" [ref=e62]: 07:00
                    - generic [ref=e63]:
                      - generic [ref=e64]: Hora real de fin
                      - textbox "Hora real de fin" [ref=e65]: 08:00
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
                      - spinbutton "Frecuencia cardíaca (lpm)" [ref=e81]: "80"
                      - paragraph [ref=e82]: "Rango clínico: 30-220 lpm"
                    - generic [ref=e83]:
                      - generic [ref=e84]: Frecuencia respiratoria (rpm)
                      - spinbutton "Frecuencia respiratoria (rpm)" [ref=e85]: "16"
                      - paragraph [ref=e86]: "Rango clínico: 5-60 rpm"
                  - generic [ref=e87]:
                    - generic [ref=e88]:
                      - generic [ref=e89]: Saturación oxígeno (%)
                      - spinbutton "Saturación oxígeno (%)" [active] [ref=e90]
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
                        - spinbutton "Presión sistólica (mmHg)" [ref=e101]: "120"
                        - paragraph [ref=e102]: "Rango clínico: 60-260 mmHg"
                      - generic [ref=e103]:
                        - generic [ref=e104]: Presión diastólica (mmHg)
                        - spinbutton "Presión diastólica (mmHg)" [ref=e105]: "80"
                        - paragraph [ref=e106]: "Rango clínico: 30-150 mmHg"
              - generic [ref=e107]:
                - button "EVA ▲" [ref=e108]
                - generic [ref=e109]:
                  - generic [ref=e110]: Puntuación EVA
                  - spinbutton "Puntuación EVA" [ref=e111]: "2"
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
  - alert [ref=e123]
```

# Test source

```ts
  1   | import { expect, test, type Page } from "@playwright/test";
  2   | import { loadFinalizeMinimalSeed } from "../support/load-finalize-minimal-seed";
  3   | 
  4   | const PATIENT_ID = "e2e-finalize-patient-1";
  5   | const ENCOUNTER_ID = "e2e-finalize-encounter-1";
  6   | const ENCOUNTER_URL = `/patients/${PATIENT_ID}/encounters/${ENCOUNTER_ID}`;
  7   | const PATIENT_URL = `/patients/${PATIENT_ID}`;
  8   | 
  9   | const FINALIZED_BANNER = "Esta visita está finalizada y no puede editarse";
  10  | 
  11  | async function finalizeSeededEncounter(page: Page, clinicalNoteSentinel: string) {
  12  |   const consoleMessages: string[] = [];
  13  |   const consoleListener = (msg: { type: () => string; text: () => string }) => {
  14  |     const formatted = `[console] [${msg.type()}] ${msg.text()}`;
  15  |     consoleMessages.push(formatted);
  16  |     console.log(formatted);
  17  |   };
  18  |   page.on("console", consoleListener);
  19  | 
  20  |   await page.goto(ENCOUNTER_URL);
  21  | 
  22  |   const renderedMainText = (await page.locator("main").innerText().catch(() => ""))
  23  |     .replace(/\s+/g, " ")
  24  |     .trim();
  25  |   const surfaceFlags = {
  26  |     hasStartButton: await page.getByRole("button", { name: "Iniciar visita" }).count(),
  27  |     hasSaveProgressButton: await page.getByRole("button", { name: "Guardar progreso" }).count(),
  28  |     hasFinalizeButton: await page.getByRole("button", { name: "Finalizar visita" }).count(),
  29  |     hasFinishedBanner: await page.getByText(FINALIZED_BANNER).count(),
  30  |     hasNotFound: await page.getByText("Encuentro no encontrado").count(),
  31  |   };
  32  | 
  33  |   console.log("[encounter-finalize.seeded] initial-load-debug", {
  34  |     url: page.url(),
  35  |     renderedMainText,
  36  |     surfaceFlags,
  37  |   });
  38  | 
  39  |   await expect(page.getByRole("button", { name: "Guardar progreso" })).toBeVisible();
  40  |   await expect(page.getByRole("button", { name: "Finalizar visita" })).toBeVisible();
  41  | 
  42  |   await page.getByLabel("Fecha real").fill("2026-04-01");
  43  |   await page.getByLabel("Hora real de inicio").fill("07:00");
  44  |   await page.getByLabel("Hora real de fin").fill("08:00");
  45  |   await page.getByLabel("Nota clínica *").fill(clinicalNoteSentinel);
  46  |   await page.getByLabel("Frecuencia cardíaca (lpm)").fill("80");
  47  |   await page.getByLabel("Frecuencia respiratoria (rpm)").fill("16");
  48  |   await page.getByLabel("Presión sistólica (mmHg)").fill("120");
  49  |   await page.getByLabel("Presión diastólica (mmHg)").fill("80");
  50  |   await page.getByLabel("Puntuación EVA").fill("2");
  51  | 
  52  |   const alert = page.getByRole("alert");
  53  |   const initialAlertText = ((await alert.first().textContent().catch(() => "")) ?? "").trim();
  54  | 
  55  |   await page.getByRole("button", { name: "Finalizar visita" }).click();
  56  | 
  57  |   const navigationAfterClick = page
  58  |     .waitForEvent("framenavigated", { timeout: 10000 })
  59  |     .then(() => "navigated")
  60  |     .catch(() => null);
  61  |   const alertChangedAfterClick = page
  62  |     .waitForFunction(
  63  |       ({ previousAlertText }) => {
  64  |         const alertElement = document.querySelector('[role="alert"]');
  65  |         const currentAlertText = (alertElement?.textContent ?? "").trim();
  66  |         return currentAlertText.length > 0 && currentAlertText !== previousAlertText;
  67  |       },
  68  |       { previousAlertText: initialAlertText },
  69  |       { timeout: 10000 },
  70  |     )
  71  |     .then(() => "alert-changed")
  72  |     .catch(() => null);
  73  |   const postClickSignal = await Promise.race([navigationAfterClick, alertChangedAfterClick]);
  74  | 
  75  |   console.log("[encounter-finalize.seeded] post-click-signal", postClickSignal ?? "none-within-timeout");
  76  |   console.log("[encounter-finalize.seeded] URL AFTER SUBMIT:", page.url());
  77  | 
  78  |   const allAlertTexts = await alert.allTextContents();
  79  |   console.log('[encounter-finalize.seeded] role="alert" allTextContents:', allAlertTexts);
  80  |   console.log(
  81  |     '[encounter-finalize.seeded] role="alert" first textContent:',
  82  |     await alert.first().textContent().catch(() => null),
  83  |   );
  84  | 
  85  |   const visibleErrorLocator = page.locator(
  86  |     ':is(:text-matches("error", "i"), :text-matches("inválido", "i"), :text-matches("requerido", "i")):visible',
  87  |   );
  88  |   const visibleErrorCount = await visibleErrorLocator.count();
  89  |   const visibleErrorTexts = await visibleErrorLocator.allTextContents();
  90  |   console.log("[encounter-finalize.seeded] visible error-like elements:", {
  91  |     count: visibleErrorCount,
  92  |     texts: visibleErrorTexts.map((text) => text.trim()).filter(Boolean),
  93  |   });
  94  | 
  95  |   console.log("[encounter-finalize.seeded] captured-console-count:", consoleMessages.length);
  96  |   page.off("console", consoleListener);
  97  | 
> 98  |   await expect(page.getByText(FINALIZED_BANNER)).toBeVisible({ timeout: 15000 });
      |                                                  ^ Error: expect(locator).toBeVisible() failed
  99  | }
  100 | 
  101 | test.describe("encounter finalize flow (seeded baseline)", () => {
  102 |   test.beforeEach(async () => {
  103 |     await loadFinalizeMinimalSeed();
  104 |   });
  105 | 
  106 |   test("in-progress encounter can be finalized and becomes read-only", async ({ page }) => {
  107 |     const clinicalNoteSentinel = "E2E finalize clinical note";
  108 | 
  109 |     await finalizeSeededEncounter(page, clinicalNoteSentinel);
  110 | 
  111 |     await expect(page.getByText(FINALIZED_BANNER)).toBeVisible();
  112 |     await expect(page.getByText(clinicalNoteSentinel)).toBeVisible();
  113 |   });
  114 | 
  115 |   test("after finalize, patient detail switches to finished encounter as clinical source", async ({ page }) => {
  116 |     const clinicalNoteSentinel = "E2E finalize note for patient detail";
  117 | 
  118 |     await finalizeSeededEncounter(page, clinicalNoteSentinel);
  119 | 
  120 |     await page.goto(PATIENT_URL);
  121 | 
  122 |     await expect(page.getByRole("button", { name: "Completar visita" })).toHaveCount(0);
  123 |     await expect(page.getByText("ÚLTIMA VISITA")).toBeVisible();
  124 |     await expect(page.getByText(clinicalNoteSentinel)).toBeVisible();
  125 |   });
  126 | });
  127 | 
```