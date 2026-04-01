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

Locator: getByRole('heading', { name: 'Próximo paso' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('heading', { name: 'Próximo paso' })

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
    - alert [ref=e11]:
      - generic [ref=e12]:
        - generic [ref=e16]:
          - heading "Error al cargar el paciente" [level=2] [ref=e17]
          - paragraph [ref=e18]: "HAPI-2001: Resource Patient/pac-4 is not known"
        - separator [ref=e19]
        - button "Reintentar" [ref=e21]
  - contentinfo [ref=e22]:
    - paragraph [ref=e23]: FhirFlow · FHIR R4 · Proyecto de aprendizaje
  - generic [ref=e28] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e29]:
      - img [ref=e30]
    - generic [ref=e33]:
      - button "Open issues overlay" [ref=e34]:
        - generic [ref=e35]:
          - generic [ref=e36]: "1"
          - generic [ref=e37]: "2"
        - generic [ref=e38]:
          - text: Issue
          - generic [ref=e39]: s
      - button "Collapse issues badge" [ref=e40]:
        - img [ref=e41]
  - alert [ref=e43]
```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test";
  2  | 
  3  | test("planned encounter can be started and becomes in-progress", async ({ page }) => {
  4  |   await page.goto("/patients/pac-4/encounters/enc-pac4-4");
  5  | 
> 6  |   await expect(page.getByRole("heading", { name: "Próximo paso" })).toBeVisible();
     |                                                                     ^ Error: expect(locator).toBeVisible() failed
  7  |   await expect(page.getByRole("button", { name: "Iniciar visita" })).toBeVisible();
  8  | 
  9  |   const startDate = page.getByLabel("Fecha real");
  10 |   const startTime = page.getByLabel("Hora real");
  11 | 
  12 |   await startDate.fill("2026-03-20");
  13 |   await startTime.fill("10:00");
  14 | 
  15 |   await page.getByRole("button", { name: "Iniciar visita" }).click();
  16 |   await page.waitForLoadState("networkidle");
  17 | 
  18 |   await expect(page.getByRole("heading", { name: "Finalizar visita" })).toBeVisible();
  19 |   await expect(page.getByRole("button", { name: "Guardar progreso" })).toBeVisible();
  20 | });
  21 | 
```