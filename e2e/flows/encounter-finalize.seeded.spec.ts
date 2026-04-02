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

  const allNetworkRequestListener = (request: { method: () => string; url: () => string; resourceType: () => string }) => {
    const resourceType = request.resourceType();
    if (resourceType === "fetch" || resourceType === "xhr") {
      console.log("[encounter-finalize.seeded] network-request-all", {
        method: request.method(),
        url: request.url(),
      });
    }
  };
  page.on("request", allNetworkRequestListener);

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
  await page.waitForFunction(() => {
    const finalizeButton = Array.from(document.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Finalizar visita"),
    );
    return Boolean(finalizeButton) && !finalizeButton.disabled;
  });
  await page.waitForLoadState("networkidle");

  await page.getByLabel("Fecha real").fill("2026-04-01");
  await page.getByLabel("Hora real de inicio").fill("07:00");
  await page.getByLabel("Hora real de fin").fill("08:00");
  await page.getByLabel("Nota clínica *").fill(clinicalNoteSentinel);
  await page.getByLabel("Frecuencia cardíaca (lpm)").fill("80");
  await page.getByLabel("Frecuencia respiratoria (rpm)").fill("16");
  await page.getByLabel("Presión sistólica (mmHg)").fill("120");
  await page.getByLabel("Presión diastólica (mmHg)").fill("80");
  await page.getByLabel("Puntuación EVA").fill("2");
  await page.waitForLoadState("networkidle");

  const fieldValuesBeforeSubmit = {
    fechaReal: await page.getByLabel("Fecha real").inputValue(),
    horaRealInicio: await page.getByLabel("Hora real de inicio").inputValue(),
    horaRealFin: await page.getByLabel("Hora real de fin").inputValue(),
    notaClinica: await page.getByLabel("Nota clínica *").inputValue(),
    frecuenciaCardiaca: await page.getByLabel("Frecuencia cardíaca (lpm)").inputValue(),
    frecuenciaRespiratoria: await page.getByLabel("Frecuencia respiratoria (rpm)").inputValue(),
    presionSistolica: await page.getByLabel("Presión sistólica (mmHg)").inputValue(),
    presionDiastolica: await page.getByLabel("Presión diastólica (mmHg)").inputValue(),
    puntuacionEva: await page.getByLabel("Puntuación EVA").inputValue(),
  };
  console.log("[encounter-finalize.seeded] field-values-before-submit", fieldValuesBeforeSubmit);

  const alert = page.getByRole("alert");
  const initialAlertText = ((await alert.first().textContent().catch(() => "")) ?? "").trim();

  const submitNetworkRequestListener = (request: { method: () => string; url: () => string }) => {
    const url = request.url();
    if (url.includes("/patients/") || url.toLowerCase().includes('action')) {
      console.log("[encounter-finalize.seeded] network-request", {
        method: request.method(),
        url,
      });
    }
  };
  page.on("request", submitNetworkRequestListener);

  await page.getByRole("button", { name: "Finalizar visita" }).click();
  await page.waitForTimeout(3000);
  const postFinalizeRouteOrBanner = await Promise.race([
    page
      .waitForURL((url) => !url.pathname.endsWith(`/encounters/${ENCOUNTER_ID}`), { timeout: 20000 })
      .then(() => "url-changed")
      .catch(() => null),
    page
      .waitForSelector(`text=${FINALIZED_BANNER}`, { timeout: 20000 })
      .then(() => "banner-visible")
      .catch(() => null),
  ]);
  console.log(
    "[encounter-finalize.seeded] post-click-route-or-banner",
    postFinalizeRouteOrBanner ?? "none-within-timeout",
  );

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

  console.log(
    '[encounter-finalize.seeded] role="alert" first textContent:',
    await alert.first().textContent().catch(() => null),
  );

  const ariaInvalidCount = await page.locator('[aria-invalid="true"]').count();
  const ariaDescribedByCount = await page.locator('[aria-describedby]').count();
  const validationTexts = await page
    .getByText(/requerido|inválido|obligatorio|debe|mayor|menor/i)
    .allTextContents()
    .catch(() => []);
  const formCount = await page.locator("form").count();

  console.log("[encounter-finalize.seeded] validation-diagnostics", {
    ariaInvalidCount,
    ariaDescribedByCount,
    validationTexts,
    formCount,
  });

  console.log("[encounter-finalize.seeded] captured-console-count:", consoleMessages.length);
  page.off("console", consoleListener);
  page.off("request", submitNetworkRequestListener);
  page.off("request", allNetworkRequestListener);

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
