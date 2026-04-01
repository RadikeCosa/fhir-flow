# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: flows/encounter-continuity.spec.ts >> planned encounter can be started and becomes in-progress
- Location: e2e/flows/encounter-continuity.spec.ts:3:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('div').filter({ hasText: 'Planificada' }).filter({ has: getByRole('link', { name: 'Abrir detalle' }) }).first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('div').filter({ hasText: 'Planificada' }).filter({ has: getByRole('link', { name: 'Abrir detalle' }) }).first()

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
      - navigation "Navegación de ubicación" [ref=e11]:
        - list [ref=e12]:
          - listitem [ref=e13]:
            - link "Pacientes" [ref=e14] [cursor=pointer]:
              - /url: /patients
            - generic [ref=e15]: ›
          - listitem [ref=e16]:
            - link "Ricardo Aníbal Fort" [ref=e17] [cursor=pointer]:
              - /url: /patients/pac-1
            - generic [ref=e18]: ›
          - listitem [ref=e19]:
            - generic [ref=e20]: Encuentros
      - heading "Historial de Encuentros" [level=1] [ref=e21]
      - generic [ref=e23]:
        - heading "Evolución del episodio activo" [level=2] [ref=e24]
        - combobox [ref=e26]:
          - option "Frecuencia cardíaca" [selected]
          - option "Frecuencia respiratoria"
          - option "Saturación de oxígeno"
          - option "Temperatura corporal"
          - option "Presión arterial"
          - option "EVA (dolor)"
        - img "Gráfico de FC (lpm) — 5 registros" [ref=e27]:
          - generic [ref=e29]:
            - generic:
              - generic:
                - generic: 1/4, 05:29 a. m.
                - generic:
                  - generic: "FC (lpm): 80 lpm"
            - list [ref=e31]:
              - listitem [ref=e32]:
                - img "FC (lpm) legend icon" [ref=e33]
                - text: FC (lpm)
            - application [ref=e35]:
              - generic [ref=e72]:
                - generic [ref=e73]:
                  - generic [ref=e75]: 31/3, 02:33 p. m.
                  - generic [ref=e77]: 31/3, 03:31 p. m.
                  - generic [ref=e79]: 31/3, 04:30 p. m.
                  - generic [ref=e81]: 31/3, 10:32 p. m.
                  - generic [ref=e83]: 1/4, 05:29 a. m.
                - generic [ref=e84]:
                  - generic [ref=e86]: "30"
                  - generic [ref=e88]: "80"
                  - generic [ref=e90]: "130"
                  - generic [ref=e92]: "180"
                  - generic [ref=e94]: "220"
      - generic [ref=e95]:
        - heading "Sesiones anteriores" [level=3] [ref=e96]
        - generic [ref=e97]:
          - generic [ref=e99]:
            - heading "Visita de seguimiento" [level=2] [ref=e100]
            - generic [ref=e101]:
              - generic [ref=e102]:
                - generic [ref=e103]:
                  - generic [ref=e104]:
                    - generic [ref=e105]:
                      - generic [ref=e106]: Finalizada
                      - generic [ref=e107]: Seguimiento
                    - generic [ref=e108]: "Inicio real: 31/03/2026, 06:31 p. m."
                  - paragraph [ref=e109]: ver si es la ultima
                - generic [ref=e110]:
                  - link "Abrir detalle" [ref=e111] [cursor=pointer]:
                    - /url: /patients/pac-1/encounters/e427b548-28b1-4cdd-bc36-9523bdaa43cb
                  - button "Ver contexto" [ref=e112]:
                    - text: Ver contexto
                    - img [ref=e113]
              - generic [ref=e115]:
                - generic [ref=e116]: Vitales
                - generic [ref=e117]: EVA
                - generic [ref=e118]: Procedimientos
          - generic [ref=e120]:
            - heading "Visita de seguimiento" [level=2] [ref=e121]
            - generic [ref=e122]:
              - generic [ref=e123]:
                - generic [ref=e124]:
                  - generic [ref=e125]:
                    - generic [ref=e126]:
                      - generic [ref=e127]: Finalizada
                      - generic [ref=e128]: Seguimiento
                    - generic [ref=e129]: "Inicio real: 31/03/2026, 12:30 p. m."
                  - paragraph [ref=e130]: Ver si empeoro en la segunda
                - generic [ref=e131]:
                  - link "Abrir detalle" [ref=e132] [cursor=pointer]:
                    - /url: /patients/pac-1/encounters/1015
                  - button "Ver contexto" [ref=e133]:
                    - text: Ver contexto
                    - img [ref=e134]
              - generic [ref=e136]:
                - generic [ref=e137]: Vitales
                - generic [ref=e138]: EVA
                - generic [ref=e139]: Procedimientos
          - generic [ref=e141]:
            - heading "Visita de seguimiento" [level=2] [ref=e142]
            - generic [ref=e143]:
              - generic [ref=e144]:
                - generic [ref=e145]:
                  - generic [ref=e146]:
                    - generic [ref=e147]:
                      - generic [ref=e148]: Finalizada
                      - generic [ref=e149]: Seguimiento
                    - generic [ref=e150]: "Inicio real: 31/03/2026, 10:40 a. m."
                  - paragraph [ref=e151]: Seguimiento
                - generic [ref=e152]:
                  - link "Abrir detalle" [ref=e153] [cursor=pointer]:
                    - /url: /patients/pac-1/encounters/d1c4b598-5ad1-4e90-b35b-f5cd619b971f
                  - button "Ver contexto" [ref=e154]:
                    - text: Ver contexto
                    - img [ref=e155]
              - generic [ref=e157]:
                - generic [ref=e158]: Vitales
                - generic [ref=e159]: EVA
                - generic [ref=e160]: Procedimientos
          - generic [ref=e162]:
            - heading "Visita de seguimiento" [level=2] [ref=e163]
            - generic [ref=e164]:
              - generic [ref=e165]:
                - generic [ref=e166]:
                  - generic [ref=e167]:
                    - generic [ref=e168]:
                      - generic [ref=e169]: Finalizada
                      - generic [ref=e170]: Seguimiento
                    - generic [ref=e171]: "Inicio real: 31/03/2026, 10:30 a. m."
                  - paragraph [ref=e172]: primer visita
                - generic [ref=e173]:
                  - link "Abrir detalle" [ref=e174] [cursor=pointer]:
                    - /url: /patients/pac-1/encounters/c23a99e9-1d51-40c2-9d04-51cdedbb7923
                  - button "Ver contexto" [ref=e175]:
                    - text: Ver contexto
                    - img [ref=e176]
              - generic [ref=e178]:
                - generic [ref=e179]: Vitales
                - generic [ref=e180]: EVA
                - generic [ref=e181]: Procedimientos
  - contentinfo [ref=e182]:
    - paragraph [ref=e183]: FhirFlow · FHIR R4 · Proyecto de aprendizaje
  - button "Open Next.js Dev Tools" [ref=e189] [cursor=pointer]:
    - img [ref=e190]
  - alert [ref=e193]
  - generic [ref=e194]: "30"
```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test";
  2  | 
  3  | test("planned encounter can be started and becomes in-progress", async ({ page }) => {
  4  |   await page.goto("/patients");
  5  | 
  6  |   const firstPatientLink = page
  7  |     .locator("a")
  8  |     .filter({ has: page.locator('article[aria-label^="Paciente:"]') })
  9  |     .first();
  10 | 
  11 |   await expect(firstPatientLink).toBeVisible();
  12 |   await firstPatientLink.click();
  13 | 
  14 |   await page.getByRole("link", { name: "Ver historial →" }).click();
  15 | 
  16 |   const plannedEncounterCard = page
  17 |     .locator("div")
  18 |     .filter({ hasText: "Planificada" })
  19 |     .filter({ has: page.getByRole("link", { name: "Abrir detalle" }) })
  20 |     .first();
  21 | 
> 22 |   await expect(plannedEncounterCard).toBeVisible();
     |                                      ^ Error: expect(locator).toBeVisible() failed
  23 |   await plannedEncounterCard.getByRole("link", { name: "Abrir detalle" }).click();
  24 | 
  25 |   await expect(page.getByRole("heading", { name: "Próximo paso" })).toBeVisible();
  26 |   await expect(page.getByRole("button", { name: "Iniciar visita" })).toBeVisible();
  27 | 
  28 |   const startDate = page.getByLabel("Fecha real");
  29 |   const startTime = page.getByLabel("Hora real");
  30 | 
  31 |   await startDate.fill("2026-03-20");
  32 |   await startTime.fill("10:00");
  33 | 
  34 |   await page.getByRole("button", { name: "Iniciar visita" }).click();
  35 |   await page.waitForLoadState("networkidle");
  36 | 
  37 |   await expect(page.getByRole("heading", { name: "Finalizar visita" })).toBeVisible();
  38 |   await expect(page.getByRole("button", { name: "Guardar progreso" })).toBeVisible();
  39 | });
  40 | 
```