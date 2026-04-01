import { expect, test, type Page } from "@playwright/test";

const ENCOUNTER_URL = "/patients/pac-1/encounters/1046";

async function ensureEncounterInProgress(page: Page) {
  await page.goto(ENCOUNTER_URL);

  const startButton = page.getByRole("button", { name: "Iniciar visita" });

  if (await startButton.isVisible()) {
    await page.getByLabel("Fecha real").fill("2026-04-01");
    await page.getByLabel("Hora real").fill("10:00");

    await startButton.click();
    await page.waitForLoadState("networkidle");
  }

  await expect(page.getByRole("heading", { name: "Finalizar visita" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Guardar progreso" })).toBeVisible();
}

test("planned encounter can be started and becomes in-progress", async ({ page }) => {
  await ensureEncounterInProgress(page);
});

test("save progress survives reload by rehydrating in-progress form", async ({ page }) => {
  await ensureEncounterInProgress(page);

  const noteSentinel = "E2E continuity note 1046";
  const evaSentinel = "7";

  await page.getByLabel("Nota clínica *").fill(noteSentinel);
  await page.getByLabel("Puntuación EVA").fill(evaSentinel);

  await page.getByRole("button", { name: "Guardar progreso" }).click();
  await page.waitForLoadState("networkidle");

  await page.reload();
  await page.waitForLoadState("networkidle");

  await expect(page.getByLabel("Nota clínica *")).toHaveValue(noteSentinel);
  await expect(page.getByLabel("Puntuación EVA")).toHaveValue(evaSentinel);
  await expect(page.getByRole("heading", { name: "Finalizar visita" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Guardar progreso" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Finalizar visita" })).toBeEnabled();
});
