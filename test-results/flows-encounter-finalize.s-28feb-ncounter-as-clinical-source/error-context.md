# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: flows/encounter-finalize.seeded.spec.ts >> encounter finalize flow (seeded baseline) >> after finalize, patient detail switches to finished encounter as clinical source
- Location: e2e/flows/encounter-finalize.seeded.spec.ts:88:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('ÚLTIMA VISITA')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('ÚLTIMA VISITA')

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
    - generic [ref=e10]:
      - navigation "Navegación de ubicación" [ref=e13]:
        - list [ref=e14]:
          - listitem [ref=e15]:
            - link "Pacientes" [ref=e16] [cursor=pointer]:
              - /url: /patients
            - generic [ref=e17]: ›
          - listitem [ref=e18]:
            - generic [ref=e19]: Paciente E2E Finalize
      - link "← Volver" [ref=e21] [cursor=pointer]:
        - /url: /patients
      - generic [ref=e22]:
        - generic [ref=e23]:
          - generic [ref=e24]:
            - heading "Información personal" [level=2] [ref=e25]
            - generic [ref=e26]:
              - term [ref=e27]: "Nombre:"
              - definition [ref=e28]: Paciente E2E Finalize
              - term [ref=e29]: "DNI:"
              - definition [ref=e30]: e2e-finalize-patient-1
              - term [ref=e31]: "Nacimiento:"
              - definition [ref=e32]: 1980-01-01 (46 años)
              - term [ref=e33]: "Género:"
              - definition [ref=e34]: Masculino
              - term [ref=e35]: "Estado civil:"
              - definition [ref=e36]: Desconocido
              - term [ref=e37]: "Estado:"
              - definition [ref=e38]: Activo
              - term [ref=e39]: "Médico:"
              - definition [ref=e40]
          - generic [ref=e41]:
            - heading "Contacto" [level=2] [ref=e42]
            - generic [ref=e43]:
              - term [ref=e44]: "Teléfono:"
              - definition [ref=e45]: No registrado
              - term [ref=e46]: "Email:"
              - definition [ref=e47]: No registrado
              - term [ref=e48]: "Dirección:"
              - definition [ref=e49]: No registrada
        - generic [ref=e50]:
          - heading "Información del episodio" [level=2] [ref=e51]
          - paragraph [ref=e52]: Sin episodio activo
        - generic [ref=e53]:
          - heading "Visitas" [level=2] [ref=e54]
          - paragraph [ref=e55]: No hay visitas registradas en el episodio activo
          - link "Ver historial →" [ref=e57] [cursor=pointer]:
            - /url: /patients/e2e-finalize-patient-1/encounters
        - generic [ref=e58]:
          - heading "Evaluación Inicial" [level=2] [ref=e59]
          - paragraph [ref=e60]: No se registró sesión de evaluación para este episodio
        - generic [ref=e61]:
          - heading "Re-evaluaciones" [level=2] [ref=e62]
          - paragraph [ref=e63]: No hay re-evaluaciones registradas en este episodio
  - contentinfo [ref=e64]:
    - paragraph [ref=e65]: FhirFlow · FHIR R4 · Proyecto de aprendizaje
  - alert [ref=e66]
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
  12  |   await page.goto(ENCOUNTER_URL);
  13  |   await page.waitForLoadState("networkidle");
  14  | 
  15  |   await expect(page.getByRole("button", { name: "Guardar progreso" })).toBeVisible();
  16  |   await expect(page.getByRole("button", { name: "Finalizar visita" })).toBeVisible();
  17  |   await page.waitForFunction(() => {
  18  |     const finalizeButton = Array.from(document.querySelectorAll("button")).find((button) =>
  19  |       button.textContent?.includes("Finalizar visita"),
  20  |     );
  21  |     return Boolean(finalizeButton) && !finalizeButton.disabled;
  22  |   });
  23  |   await page.waitForLoadState("networkidle");
  24  | 
  25  |   await page.getByLabel("Fecha real").fill("2026-04-01");
  26  |   await page.getByLabel("Hora real de inicio").fill("07:00");
  27  |   await page.getByLabel("Hora real de fin").fill("08:00");
  28  |   await page.getByLabel("Nota clínica *").fill(clinicalNoteSentinel);
  29  |   await page.getByLabel("Frecuencia cardíaca (lpm)").fill("80");
  30  |   await page.getByLabel("Frecuencia respiratoria (rpm)").fill("16");
  31  |   await page.getByLabel("Saturación oxígeno (%)").fill("98");
  32  |   await page.getByLabel("Temperatura corporal (°C)").fill("36.5");
  33  |   await page.getByLabel("Presión sistólica (mmHg)").fill("120");
  34  |   await page.getByLabel("Presión diastólica (mmHg)").fill("80");
  35  |   await page.getByLabel("Puntuación EVA").fill("2");
  36  |   await page.waitForLoadState("networkidle");
  37  | 
  38  |   const alert = page.getByRole("alert");
  39  |   const initialAlertText = ((await alert.first().textContent().catch(() => "")) ?? "").trim();
  40  | 
  41  |   await page.getByRole("button", { name: "Finalizar visita" }).click();
  42  |   await Promise.race([
  43  |     page
  44  |       .waitForURL((url) => !url.pathname.endsWith(`/encounters/${ENCOUNTER_ID}`), { timeout: 20000 })
  45  |       .then(() => "url-changed")
  46  |       .catch(() => null),
  47  |     page
  48  |       .waitForSelector(`text=${FINALIZED_BANNER}`, { timeout: 20000 })
  49  |       .then(() => "banner-visible")
  50  |       .catch(() => null),
  51  |   ]);
  52  | 
  53  |   const navigationAfterClick = page
  54  |     .waitForEvent("framenavigated", { timeout: 10000 })
  55  |     .then(() => "navigated")
  56  |     .catch(() => null);
  57  |   const alertChangedAfterClick = page
  58  |     .waitForFunction(
  59  |       ({ previousAlertText }) => {
  60  |         const alertElement = document.querySelector('[role="alert"]');
  61  |         const currentAlertText = (alertElement?.textContent ?? "").trim();
  62  |         return currentAlertText.length > 0 && currentAlertText !== previousAlertText;
  63  |       },
  64  |       { previousAlertText: initialAlertText },
  65  |       { timeout: 10000 },
  66  |     )
  67  |     .then(() => "alert-changed")
  68  |     .catch(() => null);
  69  |   await Promise.race([navigationAfterClick, alertChangedAfterClick]);
  70  | 
  71  |   await expect(page.getByText(FINALIZED_BANNER)).toBeVisible({ timeout: 15000 });
  72  | }
  73  | 
  74  | test.describe("encounter finalize flow (seeded baseline)", () => {
  75  |   test.beforeEach(async () => {
  76  |     await loadFinalizeMinimalSeed();
  77  |   });
  78  | 
  79  |   test("in-progress encounter can be finalized and becomes read-only", async ({ page }) => {
  80  |     const clinicalNoteSentinel = "E2E finalize clinical note";
  81  | 
  82  |     await finalizeSeededEncounter(page, clinicalNoteSentinel);
  83  | 
  84  |     await expect(page.getByText(FINALIZED_BANNER)).toBeVisible();
  85  |     await expect(page.getByText(clinicalNoteSentinel)).toBeVisible();
  86  |   });
  87  | 
  88  |   test("after finalize, patient detail switches to finished encounter as clinical source", async ({ page }) => {
  89  |     const clinicalNoteSentinel = "E2E finalize note for patient detail";
  90  | 
  91  |     await finalizeSeededEncounter(page, clinicalNoteSentinel);
  92  | 
  93  |     await page.goto(PATIENT_URL);
  94  | 
  95  |     await expect(page.getByRole("button", { name: "Completar visita" })).toHaveCount(0);
> 96  |     await expect(page.getByText("ÚLTIMA VISITA")).toBeVisible();
      |                                                   ^ Error: expect(locator).toBeVisible() failed
  97  |     await expect(page.getByText(clinicalNoteSentinel)).toBeVisible();
  98  |   });
  99  | });
  100 | 
```