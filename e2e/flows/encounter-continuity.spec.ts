import { expect, test, type Page } from "@playwright/test";
import { loadContinuityMinimalSeed } from "../support/load-continuity-minimal-seed";

const PATIENT_ID = "e2e-continuity-patient-1";
const ENCOUNTER_ID = "e2e-continuity-encounter-1";
const ENCOUNTER_URL = `/patients/${PATIENT_ID}/encounters/${ENCOUNTER_ID}`;

async function startEncounterFromPlanned(page: Page) {
  await page.goto(ENCOUNTER_URL);
  await page.waitForLoadState("networkidle");

  const startButton = page.getByRole("button", { name: "Iniciar visita" });
  await expect(startButton).toBeVisible();

  await page.getByLabel("Fecha real").fill("2026-04-02");
  await page.getByLabel("Hora real").fill("10:00");

  await startButton.click();
  await page.waitForLoadState("networkidle");

  await expect(page.getByRole("button", { name: "Guardar progreso" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Finalizar visita" })).toBeVisible();
}

test.beforeEach(async () => {
  await loadContinuityMinimalSeed();
});

test("planned encounter can be started and becomes in-progress", async ({ page }) => {
  await startEncounterFromPlanned(page);
});

test("save progress survives reload by rehydrating in-progress form", async ({ page }) => {
  await startEncounterFromPlanned(page);

  const noteSentinel = "E2E continuity note seeded";
  const evaSentinel = "7";
  const heartRateSentinel = "80";
  const respiratoryRateSentinel = "18";
  const bloodPressureSystolicSentinel = "120";
  const bloodPressureDiastolicSentinel = "80";

  await page.getByLabel("Nota clínica *").fill(noteSentinel);
  await page.getByLabel("Puntuación EVA").fill(evaSentinel);

  await page.getByLabel("Frecuencia cardíaca (lpm)").fill(heartRateSentinel);
  await page.getByLabel("Frecuencia respiratoria (rpm)").fill(respiratoryRateSentinel);
  await page.getByLabel("Saturación oxígeno (%)").fill("98");
  await page.getByLabel("Temperatura corporal (°C)").fill("36.5");

  await page
    .getByLabel("Presión sistólica (mmHg)")
    .fill(bloodPressureSystolicSentinel);
  await page
    .getByLabel("Presión diastólica (mmHg)")
    .fill(bloodPressureDiastolicSentinel);

  await Promise.all([
    page.waitForLoadState("networkidle"),
    page.getByRole("button", { name: "Guardar progreso" }).click(),
  ]);
  await expect(page.getByRole("status")).toContainText(
    "Progreso guardado correctamente."
  );

  await page.reload();
  await page.waitForLoadState("networkidle");

  await expect(page.getByLabel("Nota clínica *")).toHaveValue(noteSentinel);
  await expect(page.getByLabel("Puntuación EVA")).toHaveValue(evaSentinel);
  await expect(page.getByLabel("Frecuencia cardíaca (lpm)")).toHaveValue(
    heartRateSentinel
  );
  await expect(page.getByLabel("Frecuencia respiratoria (rpm)")).toHaveValue(
    respiratoryRateSentinel
  );
  await expect(page.getByLabel("Presión sistólica (mmHg)")).toHaveValue(
    bloodPressureSystolicSentinel
  );
  await expect(page.getByLabel("Presión diastólica (mmHg)")).toHaveValue(
    bloodPressureDiastolicSentinel
  );
});
