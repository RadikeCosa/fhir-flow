import { expect, test, type Page } from "@playwright/test";
import { loadFinalizeMinimalSeed } from "../support/load-finalize-minimal-seed";

const PATIENT_ID = "e2e-finalize-patient-1";
const ENCOUNTER_ID = "e2e-finalize-encounter-1";
const ENCOUNTER_URL = `/patients/${PATIENT_ID}/encounters/${ENCOUNTER_ID}`;
const PATIENT_URL = `/patients/${PATIENT_ID}`;

async function finalizeSeededEncounter(page: Page, clinicalNoteSentinel: string) {
  await page.goto(ENCOUNTER_URL);
  await page.waitForLoadState("networkidle");

  await expect(page.getByRole("button", { name: "Guardar progreso" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Finalizar visita" })).toBeVisible();

  await page.getByLabel("Fecha real").fill("2026-04-01");
  await page.getByLabel("Hora real de inicio").fill("10:00");
  await page.getByLabel("Hora real de fin").fill("11:00");
  await page.getByLabel("Nota clínica *").fill(clinicalNoteSentinel);

  await page.getByRole("button", { name: "Finalizar visita" }).click();
}

test.describe("encounter finalize flow (seeded baseline)", () => {
  test.beforeEach(async () => {
    await loadFinalizeMinimalSeed();
  });

  test("in-progress encounter can be finalized and becomes read-only", async ({ page }) => {
    const clinicalNoteSentinel = "E2E finalize clinical note";

    await finalizeSeededEncounter(page, clinicalNoteSentinel);

    await expect(
      page.getByText("Esta visita está finalizada y no puede editarse"),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Guardar progreso" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Finalizar visita" })).toHaveCount(0);
    await expect(page.getByText(clinicalNoteSentinel)).toBeVisible();
  });

  test("after finalize, patient detail switches to finished encounter as clinical source", async ({ page }) => {
    const clinicalNoteSentinel = "E2E finalize note for patient detail";

    await finalizeSeededEncounter(page, clinicalNoteSentinel);

    await expect(
      page.getByText("Esta visita está finalizada y no puede editarse"),
    ).toBeVisible();

    await page.goto(PATIENT_URL);
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("button", { name: "Completar visita" })).toHaveCount(0);
    await expect(page.getByText("ÚLTIMA VISITA")).toBeVisible();
    await expect(page.getByText(clinicalNoteSentinel)).toBeVisible();
  });
});
