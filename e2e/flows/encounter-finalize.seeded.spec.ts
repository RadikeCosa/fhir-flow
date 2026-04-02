import { expect, test, type Page } from "@playwright/test";
import { loadFinalizeMinimalSeed } from "../support/load-finalize-minimal-seed";

const PATIENT_ID = "e2e-finalize-patient-1";
const ENCOUNTER_ID = "e2e-finalize-encounter-1";
const ENCOUNTER_URL = `/patients/${PATIENT_ID}/encounters/${ENCOUNTER_ID}`;
const PATIENT_URL = `/patients/${PATIENT_ID}`;

const FINALIZED_BANNER = "Esta visita está finalizada y no puede editarse";

async function finalizeSeededEncounter(page: Page, clinicalNoteSentinel: string) {
  await page.goto(ENCOUNTER_URL);
  await page.waitForLoadState("networkidle");

  await expect(page.getByRole("button", { name: "Guardar progreso" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Finalizar visita" })).toBeVisible();
  await page.waitForFunction(() => {
    const finalizeButton = Array.from(document.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Finalizar visita"),
    );
    if (!finalizeButton) {
      return false;
    }

    return !finalizeButton.disabled;
  });
  await page.waitForLoadState("networkidle");

  await page.getByLabel("Fecha real").fill("2026-04-01");
  await page.getByLabel("Hora real de inicio").fill("07:00");
  await page.getByLabel("Hora real de fin").fill("08:00");
  await page.getByLabel("Nota clínica *").fill(clinicalNoteSentinel);
  await page.getByLabel("Frecuencia cardíaca (lpm)").fill("80");
  await page.getByLabel("Frecuencia respiratoria (rpm)").fill("16");
  await page.getByLabel("Saturación oxígeno (%)").fill("98");
  await page.getByLabel("Temperatura corporal (°C)").fill("36.5");
  await page.getByLabel("Presión sistólica (mmHg)").fill("120");
  await page.getByLabel("Presión diastólica (mmHg)").fill("80");
  await page.getByLabel("Puntuación EVA").fill("2");
  await page.waitForLoadState("networkidle");

  const alert = page.getByRole("alert");
  const initialAlertText = ((await alert.first().textContent().catch(() => "")) ?? "").trim();

  await page.getByRole("button", { name: "Finalizar visita" }).click();
  await Promise.race([
    page
      .waitForURL((url) => !url.pathname.endsWith(`/encounters/${ENCOUNTER_ID}`), { timeout: 20000 })
      .then(() => "url-changed")
      .catch(() => null),
    page
      .waitForSelector(`text=${FINALIZED_BANNER}`, { timeout: 20000 })
      .then(() => "banner-visible")
      .catch(() => null),
  ]);

  const navigationAfterClick = page
    .waitForEvent("framenavigated", { timeout: 10000 })
    .then(() => "navigated")
    .catch(() => null);
  const alertChangedAfterClick = page
    .waitForFunction(
      ({ previousAlertText }) => {
        const alertElement = document.querySelector('[role="alert"]');
        const currentAlertText = (alertElement?.textContent ?? "").trim();
        return currentAlertText.length > 0 && currentAlertText !== previousAlertText;
      },
      { previousAlertText: initialAlertText },
      { timeout: 10000 },
    )
    .then(() => "alert-changed")
    .catch(() => null);
  await Promise.race([navigationAfterClick, alertChangedAfterClick]);

  await expect(page.getByText(FINALIZED_BANNER)).toBeVisible({ timeout: 15000 });
}

test.describe("encounter finalize flow (seeded baseline)", () => {
  test.beforeEach(async () => {
    await loadFinalizeMinimalSeed();
  });

  test("in-progress encounter can be finalized and becomes read-only", async ({ page }) => {
    const clinicalNoteSentinel = "E2E finalize clinical note";

    await finalizeSeededEncounter(page, clinicalNoteSentinel);

    await expect(page.getByText(FINALIZED_BANNER)).toBeVisible();
    await expect(page.getByText(clinicalNoteSentinel)).toBeVisible();
  });

  test("after finalize, patient detail shows no active episode state for this seeded scenario", async ({ page }) => {
    const clinicalNoteSentinel = "E2E finalize note for patient detail";

    await finalizeSeededEncounter(page, clinicalNoteSentinel);

    await page.goto(PATIENT_URL);

    await expect(page.getByRole("button", { name: "Completar visita" })).toHaveCount(0);
    await expect(page.getByText("Sin episodio activo")).toBeVisible();
    await expect(page.getByText("No hay visitas registradas en el episodio activo")).toBeVisible();
  });
});
