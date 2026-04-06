# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: flows/encounter-continuity.spec.ts >> planned -> start -> save -> reload -> rehydrate -> finalize -> finished -> patient detail source switch
- Location: e2e/flows/encounter-continuity.spec.ts:57:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Sin episodio activo')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Sin episodio activo')

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
      - generic [ref=e11]:
        - navigation "Navegación de ubicación" [ref=e13]:
          - list [ref=e14]:
            - listitem [ref=e15]:
              - link "Pacientes" [ref=e16] [cursor=pointer]:
                - /url: /patients
              - generic [ref=e17]: ›
            - listitem [ref=e18]:
              - generic [ref=e19]: Paciente E2E Continuidad
        - generic [ref=e20]:
          - link "Registrar visita" [ref=e21] [cursor=pointer]:
            - /url: /patients/e2e-continuity-patient-1/encounters/register
          - link "Planificar visita" [ref=e22] [cursor=pointer]:
            - /url: /patients/e2e-continuity-patient-1/encounters/new
      - link "← Volver" [ref=e24] [cursor=pointer]:
        - /url: /patients
      - generic [ref=e25]:
        - generic [ref=e26]:
          - generic [ref=e27]:
            - heading "Información personal" [level=2] [ref=e28]
            - generic [ref=e29]:
              - term [ref=e30]: "Nombre:"
              - definition [ref=e31]: Paciente E2E Continuidad
              - term [ref=e32]: "DNI:"
              - definition [ref=e33]: e2e-continuity-patient-1
              - term [ref=e34]: "Nacimiento:"
              - definition [ref=e35]: 1985-05-20 (40 años)
              - term [ref=e36]: "Género:"
              - definition [ref=e37]: Femenino
              - term [ref=e38]: "Estado civil:"
              - definition [ref=e39]: Desconocido
              - term [ref=e40]: "Estado:"
              - definition [ref=e41]: Activo
              - term [ref=e42]: "Médico:"
              - definition [ref=e43]
          - generic [ref=e44]:
            - heading "Contacto" [level=2] [ref=e45]
            - generic [ref=e46]:
              - term [ref=e47]: "Teléfono:"
              - definition [ref=e48]: No registrado
              - term [ref=e49]: "Email:"
              - definition [ref=e50]: No registrado
              - term [ref=e51]: "Dirección:"
              - definition [ref=e52]: No registrada
        - generic [ref=e53]:
          - heading "Información del episodio" [level=2] [ref=e54]
          - generic [ref=e56]:
            - paragraph [ref=e57]: Low back pain
            - paragraph [ref=e58]: Zona lumbar
            - generic [ref=e59]:
              - generic [ref=e60]: Moderada
              - generic [ref=e61]: Activo
              - generic [ref=e62]: Motor
              - generic [ref=e63]: Activo desde 01/04/2026
          - link "Ver historial de encuentros" [ref=e65] [cursor=pointer]:
            - /url: /patients/e2e-continuity-patient-1/encounters
            - text: Ver historial de encuentros
            - img [ref=e66]
        - generic [ref=e68]:
          - heading "Visitas" [level=2] [ref=e69]
          - generic [ref=e70]: ÚLTIMA VISITA
          - generic [ref=e71]:
            - generic [ref=e72]:
              - generic [ref=e73]: Finalizada
              - generic [ref=e74]: Seguimiento
            - generic [ref=e75]: "Inicio real: 02/04/2026, 10:00 a. m."
          - generic [ref=e76]:
            - term [ref=e77]: "Profesional:"
            - definition [ref=e78]: Continuity Kine E2E
            - term [ref=e79]: "Duración:"
            - definition [ref=e80]: 30 min
            - term [ref=e81]: "Motivo:"
            - definition [ref=e82]: Escenario determinístico e2e continuity
          - generic [ref=e83]:
            - paragraph [ref=e84]: Nota clínica
            - generic [ref=e86]: E2E continuity full loop note
          - generic [ref=e87]:
            - heading "Dolor (EVA)" [level=2] [ref=e88]
            - generic [ref=e89]:
              - generic [ref=e90]: "7"
              - generic [ref=e91]: Intenso
          - generic [ref=e92]:
            - heading "Signos vitales" [level=2] [ref=e93]
            - generic [ref=e95]:
              - paragraph [ref=e96]: Registro 1
              - generic [ref=e97]:
                - generic [ref=e98]:
                  - generic [ref=e99]: Frec. cardíaca
                  - generic [ref=e100]: 80 lpm
                  - generic [ref=e101]: Normal
                - generic [ref=e102]:
                  - generic [ref=e103]: Frec. respiratoria
                  - generic [ref=e104]: 18 rpm
                  - generic [ref=e105]: Normal
                - generic [ref=e106]:
                  - generic [ref=e107]: SpO2
                  - generic [ref=e108]: 98%
                  - generic [ref=e109]: Normal
                - generic [ref=e110]:
                  - generic [ref=e111]: Temperatura
                  - generic [ref=e112]: 36.5 °C
                  - generic [ref=e113]: Normal
                - generic [ref=e114]:
                  - generic [ref=e115]: Tensión arterial
                  - generic [ref=e116]: 120 / 80 mmHg
                  - generic [ref=e117]: Normal
          - link "Ver historial →" [ref=e119] [cursor=pointer]:
            - /url: /patients/e2e-continuity-patient-1/encounters
        - generic [ref=e120]:
          - heading "Evaluación Inicial" [level=2] [ref=e121]
          - paragraph [ref=e122]: No se registró sesión de evaluación para este episodio
        - generic [ref=e123]:
          - heading "Re-evaluaciones" [level=2] [ref=e124]
          - paragraph [ref=e125]: No hay re-evaluaciones registradas en este episodio
  - contentinfo [ref=e126]:
    - paragraph [ref=e127]: FhirFlow · FHIR R4 · Proyecto de aprendizaje
  - button "Open Next.js Dev Tools" [ref=e133] [cursor=pointer]:
    - img [ref=e134]
  - alert [ref=e137]
```

# Test source

```ts
  3   | 
  4   | const PATIENT_ID = "e2e-continuity-patient-1";
  5   | const ENCOUNTER_ID = "e2e-continuity-encounter-1";
  6   | const FINISHED_SIBLING_REASON =
  7   |   "MOTIVO FINISHED SIBLING E2E (NO MEZCLAR EN PATIENT DETAIL)";
  8   | const IN_PROGRESS_REASON = "Escenario determinístico e2e continuity";
  9   | const ENCOUNTER_URL = `/patients/${PATIENT_ID}/encounters/${ENCOUNTER_ID}`;
  10  | const PATIENT_URL = `/patients/${PATIENT_ID}`;
  11  | 
  12  | async function startEncounterIfPlanned(page: Page) {
  13  |   await page.goto(ENCOUNTER_URL);
  14  |   await page.waitForLoadState("networkidle");
  15  | 
  16  |   const startButton = page.getByRole("button", { name: "Iniciar visita" });
  17  |   await expect(startButton).toBeVisible();
  18  | 
  19  |   await page.getByLabel("Fecha real").fill("2026-04-02");
  20  |   await page.getByLabel("Hora real").fill("10:00");
  21  | 
  22  |   await startButton.click();
  23  |   await page.waitForLoadState("networkidle");
  24  | 
  25  |   await expect(page.getByRole("button", { name: "Guardar progreso" })).toBeVisible();
  26  | }
  27  | 
  28  | test.beforeEach(async () => {
  29  |   await loadContinuityMinimalSeed();
  30  | });
  31  | 
  32  | test("planned encounter can be started and becomes in-progress", async ({ page }) => {
  33  |   await startEncounterIfPlanned(page);
  34  | });
  35  | 
  36  | test("patient detail prioritizes in-progress over finished sibling without mixing datasets", async ({
  37  |   page,
  38  | }) => {
  39  |   await startEncounterIfPlanned(page);
  40  | 
  41  |   await page.goto(PATIENT_URL);
  42  |   await page.waitForLoadState("networkidle");
  43  | 
  44  |   await expect(page.getByText("Sin episodio activo")).toHaveCount(0);
  45  |   await expect(page.getByText("No hay visitas registradas en el episodio activo")).toHaveCount(0);
  46  | 
  47  |   const completeVisitLink = page.getByRole("link", { name: "Completar visita" });
  48  |   await expect(completeVisitLink).toBeVisible();
  49  |   await expect(completeVisitLink).toHaveAttribute(
  50  |     "href",
  51  |     `/patients/${PATIENT_ID}/encounters/${ENCOUNTER_ID}`,
  52  |   );
  53  |   await expect(page.getByText(IN_PROGRESS_REASON)).toBeVisible();
  54  |   await expect(page.getByText(FINISHED_SIBLING_REASON)).toHaveCount(0);
  55  | });
  56  | 
  57  | test("planned -> start -> save -> reload -> rehydrate -> finalize -> finished -> patient detail source switch", async ({
  58  |   page,
  59  | }) => {
  60  |   await startEncounterIfPlanned(page);
  61  | 
  62  |   const noteSentinel = "E2E continuity full loop note";
  63  |   const evaSentinel = "7";
  64  |   const heartRateSentinel = "80";
  65  |   const respiratoryRateSentinel = "18";
  66  | 
  67  |   await page.getByLabel("Nota clínica *").fill(noteSentinel);
  68  |   await page.getByLabel("Puntuación EVA").fill(evaSentinel);
  69  |   await page.getByLabel("Frecuencia cardíaca (lpm)").fill(heartRateSentinel);
  70  |   await page.getByLabel("Frecuencia respiratoria (rpm)").fill(respiratoryRateSentinel);
  71  |   await page.getByLabel("Saturación oxígeno (%)").fill("98");
  72  |   await page.getByLabel("Temperatura corporal (°C)").fill("36.5");
  73  |   await page.getByLabel("Presión sistólica (mmHg)").fill("120");
  74  |   await page.getByLabel("Presión diastólica (mmHg)").fill("80");
  75  | 
  76  |   await Promise.all([
  77  |     page.waitForLoadState("networkidle"),
  78  |     page.getByRole("button", { name: "Guardar progreso" }).click(),
  79  |   ]);
  80  |   await expect(page.getByRole("status")).toContainText("Progreso guardado correctamente.");
  81  | 
  82  |   await page.reload();
  83  |   await page.waitForLoadState("networkidle");
  84  | 
  85  |   await expect(page).toHaveURL(ENCOUNTER_URL);
  86  |   await expect(page.getByLabel("Nota clínica *")).toHaveValue(noteSentinel);
  87  |   await expect(page.getByLabel("Puntuación EVA")).toHaveValue(evaSentinel);
  88  |   await expect(page.getByLabel("Frecuencia cardíaca (lpm)")).toHaveValue(heartRateSentinel);
  89  |   await expect(page.getByLabel("Frecuencia respiratoria (rpm)")).toHaveValue(respiratoryRateSentinel);
  90  |   await expect(page.getByRole("button", { name: "Finalizar visita" })).toBeVisible();
  91  | 
  92  |   await page.getByLabel("Fecha real").fill("2026-04-02");
  93  |   await page.getByLabel("Hora real de inicio").fill("10:00");
  94  |   await page.getByLabel("Hora real de fin").fill("10:30");
  95  | 
  96  |   await page.getByRole("button", { name: "Finalizar visita" }).click();
  97  |   await expect(page.getByText("Esta visita está finalizada y no puede editarse")).toBeVisible({ timeout: 15000 });
  98  |   await expect(page.getByText(noteSentinel)).toBeVisible();
  99  | 
  100 |   await page.goto(PATIENT_URL);
  101 |   await page.waitForLoadState("networkidle");
  102 | 
> 103 |   await expect(page.getByText("Sin episodio activo")).toBeVisible();
      |                                                       ^ Error: expect(locator).toBeVisible() failed
  104 |   await expect(page.getByText("No hay visitas registradas en el episodio activo")).toBeVisible();
  105 |   await expect(page.getByText("VISITA EN CURSO")).toHaveCount(0);
  106 |   await expect(page.getByRole("link", { name: "Completar visita" })).toHaveCount(0);
  107 | });
  108 | 
```