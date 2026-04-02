import { expect, test, type Page } from "@playwright/test";
import { loadFinalizeMinimalSeed } from "../support/load-finalize-minimal-seed";

const PATIENT_ID = "e2e-finalize-patient-1";
const ENCOUNTER_ID = "e2e-finalize-encounter-1";
const ENCOUNTER_URL = `/patients/${PATIENT_ID}/encounters/${ENCOUNTER_ID}`;
const PATIENT_URL = `/patients/${PATIENT_ID}`;

const FINALIZED_BANNER = "Esta visita está finalizada y no puede editarse";

async function waitForEncounterToRenderFinished(page: Page) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const banner = page.getByText(FINALIZED_BANNER);
    if (await banner.count().catch(() => 0)) {
      await expect(banner).toBeVisible();
      return;
    }

    await page.waitForTimeout(400);
    await page.reload({ waitUntil: "networkidle" });
  }

  await expect(page.getByText(FINALIZED_BANNER)).toBeVisible();
}

async function finalizeSeededEncounter(page: Page, clinicalNoteSentinel: string) {
  await page.goto(ENCOUNTER_URL);
  await page.waitForLoadState("networkidle");

  const renderedMainText = (await page.locator("main").innerText().catch(() => ""))
    .replace(/\s+/g, " ")
    .trim();
  const surfaceFlags = {
    hasStartButton: await page.getByRole("button", { name: "Iniciar visita" }).count(),
    hasSaveProgressButton: await page.getByRole("button", { name: "Guardar progreso" }).count(),
    hasFinalizeButton: await page.getByRole("button", { name: "Finalizar visita" }).count(),
    hasFinishedBanner: await page.getByText(FINALIZED_BANNER).count(),
    hasNotFound: await page.getByText("Encuentro no encontrado").count(),
  };

  console.log("[encounter-finalize.seeded] initial-load-debug", {
    url: page.url(),
    renderedMainText,
    surfaceFlags,
  });

  await expect(page.getByRole("button", { name: "Guardar progreso" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Finalizar visita" })).toBeVisible();

  await page.getByLabel("Fecha real").fill("2026-04-01");
  await page.getByLabel("Hora real de inicio").fill("10:00");
  await page.getByLabel("Hora real de fin").fill("11:00");
  await page.getByLabel("Nota clínica *").fill(clinicalNoteSentinel);

  await page.getByRole("button", { name: "Finalizar visita" }).click();

  await waitForEncounterToRenderFinished(page);
}

test.describe("encounter finalize flow (seeded baseline)", () => {
  test.beforeEach(async () => {
    await loadFinalizeMinimalSeed();
  });

  test("in-progress encounter can be finalized and becomes read-only", async ({ page }) => {
    const clinicalNoteSentinel = "E2E finalize clinical note";

    await finalizeSeededEncounter(page, clinicalNoteSentinel);

    await expect(
      page.getByText(FINALIZED_BANNER),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Guardar progreso" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Finalizar visita" })).toHaveCount(0);
    await expect(page.getByText(clinicalNoteSentinel)).toBeVisible();
  });

  test("after finalize, patient detail switches to finished encounter as clinical source", async ({ page }) => {
    const clinicalNoteSentinel = "E2E finalize note for patient detail";

    await finalizeSeededEncounter(page, clinicalNoteSentinel);

    await expect(
      page.getByText(FINALIZED_BANNER),
    ).toBeVisible();

    await page.goto(PATIENT_URL);
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("button", { name: "Completar visita" })).toHaveCount(0);
    await expect(page.getByText("ÚLTIMA VISITA")).toBeVisible();
    await expect(page.getByText(clinicalNoteSentinel)).toBeVisible();
  });
});
