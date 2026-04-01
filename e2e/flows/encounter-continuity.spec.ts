import { expect, test } from "@playwright/test";

test("planned encounter can be started and becomes in-progress", async ({ page }) => {
  await page.goto("/patients");

  const firstPatientLink = page
    .locator("a")
    .filter({ has: page.locator('article[aria-label^="Paciente:"]') })
    .first();

  await expect(firstPatientLink).toBeVisible();
  await firstPatientLink.click();

  const plannedDetailLink = page.getByRole("link", { name: "Ver detalle" }).first();
  await expect(plannedDetailLink).toBeVisible();
  await plannedDetailLink.click();

  await expect(page.getByRole("heading", { name: "Próximo paso" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Iniciar visita" })).toBeVisible();

  const startDate = page.getByLabel("Fecha real");
  const startTime = page.getByLabel("Hora real");

  await startDate.fill("2026-03-20");
  await startTime.fill("10:00");

  await page.getByRole("button", { name: "Iniciar visita" }).click();
  await page.waitForLoadState("networkidle");

  await expect(page.getByRole("heading", { name: "Finalizar visita" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Guardar progreso" })).toBeVisible();
});
