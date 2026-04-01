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

Locator: getByRole('link', { name: 'Ver detalle' }).first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('link', { name: 'Ver detalle' }).first()

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
              - generic [ref=e19]: Ricardo Aníbal Fort
        - generic [ref=e20]:
          - link "Registrar visita" [ref=e21] [cursor=pointer]:
            - /url: /patients/pac-1/encounters/register
          - link "Planificar visita" [ref=e22] [cursor=pointer]:
            - /url: /patients/pac-1/encounters/new
      - link "← Volver" [ref=e24] [cursor=pointer]:
        - /url: /patients
      - generic [ref=e25]:
        - generic [ref=e26]:
          - generic [ref=e27]:
            - heading "Información personal" [level=2] [ref=e28]
            - generic [ref=e29]:
              - term [ref=e30]: "Nombre:"
              - definition [ref=e31]: Ricardo Aníbal Fort
              - term [ref=e32]: "DNI:"
              - definition [ref=e33]: "20123456789"
              - term [ref=e34]: "Nacimiento:"
              - definition [ref=e35]: 1968-11-05 (57 años)
              - term [ref=e36]: "Género:"
              - definition [ref=e37]: Masculino
              - term [ref=e38]: "Estado civil:"
              - definition [ref=e39]: Casado/a
              - term [ref=e40]: "Estado:"
              - definition [ref=e41]: Activo
              - term [ref=e42]: "Médico:"
              - definition [ref=e43]: Dr. Roque Favaloro
          - generic [ref=e44]:
            - heading "Contacto" [level=2] [ref=e45]
            - generic [ref=e46]:
              - term [ref=e47]: "Teléfono:"
              - definition [ref=e48]: +54 299 154-678901
              - term [ref=e49]: "Email:"
              - definition [ref=e50]: ricardo.fort@gmail.com
              - term [ref=e51]: "Dirección:"
              - definition [ref=e52]:
                - text: Av. Argentina 1547, 3° B, Neuquén, CP 8300
                - link "Ver en Maps" [ref=e53] [cursor=pointer]:
                  - /url: https://www.google.com/maps/search/?api=1&query=Av.%20Argentina%201547%2C%203%C2%B0%20B%2C%20Neuqu%C3%A9n%2C%20CP%208300
            - generic [ref=e54]:
              - paragraph [ref=e55]: Contacto de emergencia
              - list [ref=e56]:
                - listitem [ref=e57]:
                  - paragraph [ref=e58]: "Nombre: María Laura Gómez"
                  - paragraph [ref=e59]: "Relación: Cónyuge"
                  - paragraph [ref=e60]: "Teléfono: +54 299 154-321654"
        - generic [ref=e61]:
          - heading "Información del episodio" [level=2] [ref=e62]
          - generic [ref=e63]:
            - generic [ref=e64]:
              - paragraph [ref=e65]: Infarto cerebral, no especificado
              - paragraph [ref=e66]: Hemicuerpo izquierdo
              - generic [ref=e67]:
                - generic [ref=e68]: Moderada
                - generic [ref=e69]: Activo
                - generic [ref=e70]: Motor
                - generic [ref=e71]: Activo desde 06/01/2025
            - generic [ref=e72]:
              - generic [ref=e73]:
                - generic [ref=e74]: Pedido de atención
                - generic [ref=e75]: Dr. Roque Favaloro · 02/01/2025
                - generic [ref=e76]: Debilidad muscular e incapacidad para la marcha por hemiparesia izquierda post-ACV
              - generic [ref=e77]:
                - generic [ref=e78]: Cobertura
                - generic [ref=e79]: OSPEPBA - Obra Social del Personal de Entidades de Bien Público
                - generic [ref=e80]: Plan Médico Completo 310
            - generic [ref=e81]:
              - generic [ref=e82]: Indicaciones
              - generic [ref=e83]: "Iniciar rehabilitación motora de miembro superior e inferior izquierdo. Frecuencia sugerida: 3 veces por semana. Objetivo: recuperación de marcha funcional."
          - link "Ver historial de encuentros" [ref=e85] [cursor=pointer]:
            - /url: /patients/pac-1/encounters
            - text: Ver historial de encuentros
            - img [ref=e86]
        - generic [ref=e88]:
          - heading "Visitas" [level=2] [ref=e89]
          - generic [ref=e90]: ÚLTIMA VISITA
          - generic [ref=e91]:
            - generic [ref=e92]:
              - generic [ref=e93]: Finalizada
              - generic [ref=e94]: Seguimiento
            - generic [ref=e95]: "Inicio real: 31/03/2026, 06:31 p. m."
          - generic [ref=e96]:
            - term [ref=e97]: "Profesional:"
            - definition [ref=e98]: Marty Alejandro McFly
            - term [ref=e99]: "Duración:"
            - definition [ref=e100]: 61 min
            - term [ref=e101]: "Motivo:"
            - definition [ref=e102]: ver si es la ultima
          - generic [ref=e103]:
            - paragraph [ref=e104]: Nota clínica
            - generic [ref=e106]: tiene que ser la ultima
          - generic [ref=e107]:
            - heading "Dolor (EVA)" [level=2] [ref=e108]
            - generic [ref=e109]:
              - generic [ref=e110]: "7"
              - generic [ref=e111]: Intenso
          - generic [ref=e112]:
            - heading "Signos vitales" [level=2] [ref=e113]
            - generic [ref=e115]:
              - paragraph [ref=e116]: Registro 1
              - generic [ref=e117]:
                - generic [ref=e118]:
                  - generic [ref=e119]: Frec. cardíaca
                  - generic [ref=e120]: 120 lpm
                  - generic [ref=e121]: Alerta
                - generic [ref=e122]:
                  - generic [ref=e123]: Frec. respiratoria
                  - generic [ref=e124]: 52 rpm
                  - generic [ref=e125]: Crítico
                - generic [ref=e126]:
                  - generic [ref=e127]: SpO2
                  - generic [ref=e128]: 50%
                  - generic [ref=e129]: Crítico
                - generic [ref=e130]:
                  - generic [ref=e131]: Temperatura
                  - generic [ref=e132]: 37 °C
                  - generic [ref=e133]: Normal
                - generic [ref=e134]:
                  - generic [ref=e135]: Tensión arterial
                  - generic [ref=e136]: 120 / 100 mmHg
                  - generic [ref=e137]: Normal
          - generic [ref=e138]:
            - paragraph [ref=e139]: Procedimientos
            - generic [ref=e141]:
              - text: Fisioterapia
              - generic [ref=e142]: "1"
            - generic [ref=e144]:
              - paragraph [ref=e145]: Fisioterapia
              - list [ref=e146]:
                - listitem [ref=e147]:
                  - paragraph [ref=e148]: Ultrasonido terapéutico
          - link "Ver historial →" [ref=e150] [cursor=pointer]:
            - /url: /patients/pac-1/encounters
        - generic [ref=e151]:
          - heading "Evaluación Inicial" [level=2] [ref=e152]
          - paragraph [ref=e153]: No se registró sesión de evaluación para este episodio
        - generic [ref=e154]:
          - heading "Re-evaluaciones" [level=2] [ref=e155]
          - paragraph [ref=e156]: No hay re-evaluaciones registradas en este episodio
  - contentinfo [ref=e157]:
    - paragraph [ref=e158]: FhirFlow · FHIR R4 · Proyecto de aprendizaje
  - button "Open Next.js Dev Tools" [ref=e164] [cursor=pointer]:
    - img [ref=e165]
  - alert [ref=e168]
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
  14 |   const plannedDetailLink = page.getByRole("link", { name: "Ver detalle" }).first();
> 15 |   await expect(plannedDetailLink).toBeVisible();
     |                                   ^ Error: expect(locator).toBeVisible() failed
  16 |   await plannedDetailLink.click();
  17 | 
  18 |   await expect(page.getByRole("heading", { name: "Próximo paso" })).toBeVisible();
  19 |   await expect(page.getByRole("button", { name: "Iniciar visita" })).toBeVisible();
  20 | 
  21 |   const startDate = page.getByLabel("Fecha real");
  22 |   const startTime = page.getByLabel("Hora real");
  23 | 
  24 |   await startDate.fill("2026-03-20");
  25 |   await startTime.fill("10:00");
  26 | 
  27 |   await page.getByRole("button", { name: "Iniciar visita" }).click();
  28 |   await page.waitForLoadState("networkidle");
  29 | 
  30 |   await expect(page.getByRole("heading", { name: "Finalizar visita" })).toBeVisible();
  31 |   await expect(page.getByRole("button", { name: "Guardar progreso" })).toBeVisible();
  32 | });
  33 | 
```