import { expect, test, type Page } from "@playwright/test";

const ENCOUNTER_URL = "/patients/pac-1/encounters/1065";

async function ensureEncounterInProgress(page: Page) {
  await page.goto(ENCOUNTER_URL);
  await page.waitForLoadState("networkidle");

  const startButton = page.getByRole("button", { name: "Iniciar visita" });

  if (await startButton.isVisible()) {
    await page.getByLabel("Fecha real").fill("2026-04-01");
    await page.getByLabel("Hora real").fill("10:00");

    await startButton.click();
    await page.waitForLoadState("networkidle");
  }

  console.log(await page.locator("body").innerText());
  await page.screenshot({ path: "debug-ensure-in-progress.png", fullPage: true });

  await expect(page.getByRole("button", { name: "Guardar progreso" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Finalizar visita" })).toBeVisible();
}

test("planned encounter can be started and becomes in-progress", async ({ page }) => {
  await ensureEncounterInProgress(page);
});

test("save progress survives reload by rehydrating in-progress form", async ({ page }) => {
  await ensureEncounterInProgress(page);

  const noteSentinel = "E2E continuity note 1065";
  const evaSentinel = "7";

  await page.getByLabel("Nota clínica *").fill(noteSentinel);
  await page.getByLabel("Puntuación EVA").fill(evaSentinel);

  await page.getByLabel("Frecuencia cardíaca (lpm)").fill("80");
  await page.getByLabel("Frecuencia respiratoria (rpm)").fill("18");
  await page.getByLabel("Saturación oxígeno (%)").fill("98");
  await page.getByLabel("Temperatura corporal (°C)").fill("36.5");

  await page.getByLabel("Presión sistólica (mmHg)").fill("120");
  await page.getByLabel("Presión diastólica (mmHg)").fill("80");

  await Promise.all([
    page.waitForLoadState("networkidle"),
    page.getByRole("button", { name: "Guardar progreso" }).click(),
  ]);

  await page.reload();
  await page.waitForLoadState("networkidle");

  await expect(page.getByLabel("Nota clínica *")).toHaveValue(noteSentinel);
  await expect(page.getByLabel("Puntuación EVA")).toHaveValue(evaSentinel);
});