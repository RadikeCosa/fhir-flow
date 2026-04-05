import { expect, test, type Page } from "@playwright/test";
import { loadContinuityMinimalSeed } from "../support/load-continuity-minimal-seed";

const PATIENT_ID = "e2e-continuity-patient-1";
const ENCOUNTER_ID = "e2e-continuity-encounter-1";
const ENCOUNTER_URL = `/patients/${PATIENT_ID}/encounters/${ENCOUNTER_ID}`;
const PATIENT_URL = `/patients/${PATIENT_ID}`;

async function startEncounterIfPlanned(page: Page) {
  await page.goto(ENCOUNTER_URL);
  await page.waitForLoadState("networkidle");

  const startButton = page.getByRole("button", { name: "Iniciar visita" });
  await expect(startButton).toBeVisible();

  await page.getByLabel("Fecha real").fill("2026-04-02");
  await page.getByLabel("Hora real").fill("10:00");

  await startButton.click();
  await page.waitForLoadState("networkidle");

  await expect(page.getByRole("button", { name: "Guardar progreso" })).toBeVisible();
}

test.beforeEach(async () => {
  await loadContinuityMinimalSeed();
});

test("planned encounter can be started and becomes in-progress", async ({ page }) => {
  await startEncounterIfPlanned(page);
});

test("planned -> start -> save -> reload -> rehydrate -> finalize -> finished -> patient detail source switch", async ({
  page,
}) => {
  await startEncounterIfPlanned(page);

  const noteSentinel = "E2E continuity full loop note";
  const evaSentinel = "7";
  const heartRateSentinel = "80";
  const respiratoryRateSentinel = "18";

  await page.getByLabel("Nota clínica *").fill(noteSentinel);
  await page.getByLabel("Puntuación EVA").fill(evaSentinel);
  await page.getByLabel("Frecuencia cardíaca (lpm)").fill(heartRateSentinel);
  await page.getByLabel("Frecuencia respiratoria (rpm)").fill(respiratoryRateSentinel);
  await page.getByLabel("Saturación oxígeno (%)").fill("98");
  await page.getByLabel("Temperatura corporal (°C)").fill("36.5");
  await page.getByLabel("Presión sistólica (mmHg)").fill("120");
  await page.getByLabel("Presión diastólica (mmHg)").fill("80");

  await Promise.all([
    page.waitForLoadState("networkidle"),
    page.getByRole("button", { name: "Guardar progreso" }).click(),
  ]);
  await expect(page.getByRole("status")).toContainText("Progreso guardado correctamente.");

  await page.reload();
  await page.waitForLoadState("networkidle");

  await expect(page).toHaveURL(ENCOUNTER_URL);
  await expect(page.getByLabel("Nota clínica *")).toHaveValue(noteSentinel);
  await expect(page.getByLabel("Puntuación EVA")).toHaveValue(evaSentinel);
  await expect(page.getByLabel("Frecuencia cardíaca (lpm)")).toHaveValue(heartRateSentinel);
  await expect(page.getByLabel("Frecuencia respiratoria (rpm)")).toHaveValue(respiratoryRateSentinel);
  await expect(page.getByRole("button", { name: "Finalizar visita" })).toBeVisible();

  await page.getByLabel("Fecha real").fill("2026-04-02");
  await page.getByLabel("Hora real de inicio").fill("10:00");
  await page.getByLabel("Hora real de fin").fill("10:30");

  await page.getByRole("button", { name: "Finalizar visita" }).click();
  await expect(page.getByText("Esta visita está finalizada y no puede editarse")).toBeVisible({ timeout: 15000 });
  await expect(page.getByText(noteSentinel)).toBeVisible();

  await page.goto(PATIENT_URL);
  await page.waitForLoadState("networkidle");

  await expect(page.getByText("ÚLTIMA VISITA")).toBeVisible();
  await expect(page.getByText("VISITA EN CURSO")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Completar visita" })).toHaveCount(0);
  await expect(page.getByText(noteSentinel)).toBeVisible();
  await expect(page.getByText(`EVA ${evaSentinel}/10`)).toBeVisible();
});
