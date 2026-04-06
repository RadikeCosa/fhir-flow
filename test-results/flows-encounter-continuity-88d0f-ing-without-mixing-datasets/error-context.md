# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: flows/encounter-continuity.spec.ts >> patient detail prioritizes in-progress over finished sibling without mixing datasets
- Location: e2e/flows/encounter-continuity.spec.ts:35:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('VISITA EN CURSO')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('VISITA EN CURSO')

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
            - generic [ref=e19]: Paciente E2E Continuidad
      - link "← Volver" [ref=e21] [cursor=pointer]:
        - /url: /patients
      - generic [ref=e22]:
        - generic [ref=e23]:
          - generic [ref=e24]:
            - heading "Información personal" [level=2] [ref=e25]
            - generic [ref=e26]:
              - term [ref=e27]: "Nombre:"
              - definition [ref=e28]: Paciente E2E Continuidad
              - term [ref=e29]: "DNI:"
              - definition [ref=e30]: e2e-continuity-patient-1
              - term [ref=e31]: "Nacimiento:"
              - definition [ref=e32]: 1985-05-20 (40 años)
              - term [ref=e33]: "Género:"
              - definition [ref=e34]: Femenino
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
            - /url: /patients/e2e-continuity-patient-1/encounters
        - generic [ref=e58]:
          - heading "Evaluación Inicial" [level=2] [ref=e59]
          - paragraph [ref=e60]: No se registró sesión de evaluación para este episodio
        - generic [ref=e61]:
          - heading "Re-evaluaciones" [level=2] [ref=e62]
          - paragraph [ref=e63]: No hay re-evaluaciones registradas en este episodio
  - contentinfo [ref=e64]:
    - paragraph [ref=e65]: FhirFlow · FHIR R4 · Proyecto de aprendizaje
  - button "Open Next.js Dev Tools" [ref=e71] [cursor=pointer]:
    - img [ref=e72]
  - alert [ref=e75]
```

# Test source

```ts
  1   | import { expect, test, type Page } from "@playwright/test";
  2   | import { loadContinuityMinimalSeed } from "../support/load-continuity-minimal-seed";
  3   | 
  4   | const PATIENT_ID = "e2e-continuity-patient-1";
  5   | const ENCOUNTER_ID = "e2e-continuity-encounter-1";
  6   | const FINISHED_SIBLING_REASON =
  7   |   "MOTIVO FINISHED SIBLING E2E (NO MEZCLAR EN PATIENT DETAIL)";
  8   | const ENCOUNTER_URL = `/patients/${PATIENT_ID}/encounters/${ENCOUNTER_ID}`;
  9   | const PATIENT_URL = `/patients/${PATIENT_ID}`;
  10  | 
  11  | async function startEncounterIfPlanned(page: Page) {
  12  |   await page.goto(ENCOUNTER_URL);
  13  |   await page.waitForLoadState("networkidle");
  14  | 
  15  |   const startButton = page.getByRole("button", { name: "Iniciar visita" });
  16  |   await expect(startButton).toBeVisible();
  17  | 
  18  |   await page.getByLabel("Fecha real").fill("2026-04-02");
  19  |   await page.getByLabel("Hora real").fill("10:00");
  20  | 
  21  |   await startButton.click();
  22  |   await page.waitForLoadState("networkidle");
  23  | 
  24  |   await expect(page.getByRole("button", { name: "Guardar progreso" })).toBeVisible();
  25  | }
  26  | 
  27  | test.beforeEach(async () => {
  28  |   await loadContinuityMinimalSeed();
  29  | });
  30  | 
  31  | test("planned encounter can be started and becomes in-progress", async ({ page }) => {
  32  |   await startEncounterIfPlanned(page);
  33  | });
  34  | 
  35  | test("patient detail prioritizes in-progress over finished sibling without mixing datasets", async ({
  36  |   page,
  37  | }) => {
  38  |   await startEncounterIfPlanned(page);
  39  | 
  40  |   await page.goto(PATIENT_URL);
  41  |   await page.waitForLoadState("networkidle");
  42  | 
> 43  |   await expect(page.getByText("VISITA EN CURSO")).toBeVisible();
      |                                                   ^ Error: expect(locator).toBeVisible() failed
  44  |   await expect(page.getByRole("link", { name: "Completar visita" })).toHaveAttribute(
  45  |     "href",
  46  |     `/patients/${PATIENT_ID}/encounters/${ENCOUNTER_ID}`,
  47  |   );
  48  |   await expect(page.getByText(FINISHED_SIBLING_REASON)).toHaveCount(0);
  49  | });
  50  | 
  51  | test("planned -> start -> save -> reload -> rehydrate -> finalize -> finished -> patient detail source switch", async ({
  52  |   page,
  53  | }) => {
  54  |   await startEncounterIfPlanned(page);
  55  | 
  56  |   const noteSentinel = "E2E continuity full loop note";
  57  |   const evaSentinel = "7";
  58  |   const heartRateSentinel = "80";
  59  |   const respiratoryRateSentinel = "18";
  60  | 
  61  |   await page.getByLabel("Nota clínica *").fill(noteSentinel);
  62  |   await page.getByLabel("Puntuación EVA").fill(evaSentinel);
  63  |   await page.getByLabel("Frecuencia cardíaca (lpm)").fill(heartRateSentinel);
  64  |   await page.getByLabel("Frecuencia respiratoria (rpm)").fill(respiratoryRateSentinel);
  65  |   await page.getByLabel("Saturación oxígeno (%)").fill("98");
  66  |   await page.getByLabel("Temperatura corporal (°C)").fill("36.5");
  67  |   await page.getByLabel("Presión sistólica (mmHg)").fill("120");
  68  |   await page.getByLabel("Presión diastólica (mmHg)").fill("80");
  69  | 
  70  |   await Promise.all([
  71  |     page.waitForLoadState("networkidle"),
  72  |     page.getByRole("button", { name: "Guardar progreso" }).click(),
  73  |   ]);
  74  |   await expect(page.getByRole("status")).toContainText("Progreso guardado correctamente.");
  75  | 
  76  |   await page.reload();
  77  |   await page.waitForLoadState("networkidle");
  78  | 
  79  |   await expect(page).toHaveURL(ENCOUNTER_URL);
  80  |   await expect(page.getByLabel("Nota clínica *")).toHaveValue(noteSentinel);
  81  |   await expect(page.getByLabel("Puntuación EVA")).toHaveValue(evaSentinel);
  82  |   await expect(page.getByLabel("Frecuencia cardíaca (lpm)")).toHaveValue(heartRateSentinel);
  83  |   await expect(page.getByLabel("Frecuencia respiratoria (rpm)")).toHaveValue(respiratoryRateSentinel);
  84  |   await expect(page.getByRole("button", { name: "Finalizar visita" })).toBeVisible();
  85  | 
  86  |   await page.getByLabel("Fecha real").fill("2026-04-02");
  87  |   await page.getByLabel("Hora real de inicio").fill("10:00");
  88  |   await page.getByLabel("Hora real de fin").fill("10:30");
  89  | 
  90  |   await page.getByRole("button", { name: "Finalizar visita" }).click();
  91  |   await expect(page.getByText("Esta visita está finalizada y no puede editarse")).toBeVisible({ timeout: 15000 });
  92  |   await expect(page.getByText(noteSentinel)).toBeVisible();
  93  | 
  94  |   await page.goto(PATIENT_URL);
  95  |   await page.waitForLoadState("networkidle");
  96  | 
  97  |   await expect(page.getByText("Sin episodio activo")).toBeVisible();
  98  |   await expect(page.getByText("No hay visitas registradas en el episodio activo")).toBeVisible();
  99  |   await expect(page.getByText("VISITA EN CURSO")).toHaveCount(0);
  100 |   await expect(page.getByRole("link", { name: "Completar visita" })).toHaveCount(0);
  101 | });
  102 | 
```