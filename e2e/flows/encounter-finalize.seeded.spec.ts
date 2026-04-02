import { expect, test, type Page } from "@playwright/test";
import { loadFinalizeMinimalSeed } from "../support/load-finalize-minimal-seed";

const PATIENT_ID = "e2e-finalize-patient-1";
const ENCOUNTER_ID = "e2e-finalize-encounter-1";
const ENCOUNTER_URL = `/patients/${PATIENT_ID}/encounters/${ENCOUNTER_ID}`;
const PATIENT_URL = `/patients/${PATIENT_ID}`;

const FINALIZED_BANNER = "Esta visita está finalizada y no puede editarse";

async function finalizeSeededEncounter(page: Page, clinicalNoteSentinel: string) {
  const consoleMessages: string[] = [];
  const consoleListener = (msg: { type: () => string; text: () => string }) => {
    const formatted = `[console] [${msg.type()}] ${msg.text()}`;
    consoleMessages.push(formatted);
    console.log(formatted);
  };
  page.on("console", consoleListener);

  await page.goto(ENCOUNTER_URL);

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
  await page.getByLabel("Hora real de inicio").fill("07:00");
  await page.getByLabel("Hora real de fin").fill("08:00");
  await page.getByLabel("Nota clínica *").fill(clinicalNoteSentinel);
  await page.getByLabel("Frecuencia cardíaca (lpm)").fill("80");
  await page.getByLabel("Frecuencia respiratoria (rpm)").fill("16");
  await page.getByLabel("Presión sistólica (mmHg)").fill("120");
  await page.getByLabel("Presión diastólica (mmHg)").fill("80");
  await page.getByLabel("Puntuación EVA").fill("2");

  const alert = page.getByRole("alert");
  const initialAlertText = ((await alert.first().textContent().catch(() => "")) ?? "").trim();

  await page.getByRole("button", { name: "Finalizar visita" }).click();

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
  const postClickSignal = await Promise.race([navigationAfterClick, alertChangedAfterClick]);

  console.log("[encounter-finalize.seeded] post-click-signal", postClickSignal ?? "none-within-timeout");
  console.log("[encounter-finalize.seeded] URL AFTER SUBMIT:", page.url());

  const allAlertTexts = await alert.allTextContents();
  console.log('[encounter-finalize.seeded] role="alert" allTextContents:', allAlertTexts);
  console.log(
    '[encounter-finalize.seeded] role="alert" first textContent:',
    await alert.first().textContent().catch(() => null),
  );

  const visibleErrorLocator = page.locator(
    ':is(:text-matches("error", "i"), :text-matches("inválido", "i"), :text-matches("requerido", "i")):visible',
  );
  const visibleErrorCount = await visibleErrorLocator.count();
  const visibleErrorTexts = await visibleErrorLocator.allTextContents();
  console.log("[encounter-finalize.seeded] visible error-like elements:", {
    count: visibleErrorCount,
    texts: visibleErrorTexts.map((text) => text.trim()).filter(Boolean),
  });

  console.log("[encounter-finalize.seeded] captured-console-count:", consoleMessages.length);
  page.off("console", consoleListener);

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

  test("after finalize, patient detail switches to finished encounter as clinical source", async ({ page }) => {
    const clinicalNoteSentinel = "E2E finalize note for patient detail";

    await finalizeSeededEncounter(page, clinicalNoteSentinel);

    await page.goto(PATIENT_URL);

    await expect(page.getByRole("button", { name: "Completar visita" })).toHaveCount(0);
    await expect(page.getByText("ÚLTIMA VISITA")).toBeVisible();
    await expect(page.getByText(clinicalNoteSentinel)).toBeVisible();
  });
});
