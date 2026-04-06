import { expect, test, type Page } from "@playwright/test";
import { loadContinuityMinimalSeed } from "../support/load-continuity-minimal-seed";
import { loadFinalizeMinimalSeed } from "../support/load-finalize-minimal-seed";

const FINALIZE_BASELINE_PATIENT_ID = "e2e-finalize-patient-1";
const FINALIZE_BASELINE_ENCOUNTER_ID = "e2e-finalize-encounter-1";

const CONTINUITY_PATIENT_ID = "e2e-continuity-patient-1";
const CONTINUITY_ENCOUNTER_ID = "e2e-continuity-encounter-1";

const FINALIZED_BANNER = "Esta visita está finalizada y no puede editarse";
const EMPTY_STATE_TITLE = "Sin episodio activo";
const EMPTY_STATE_SUBTITLE = "No hay visitas registradas en el episodio activo";
const LATEST_VISIT_TITLE = "ÚLTIMA VISITA";

async function startEncounterIfPlanned(page: Page, encounterUrl: string) {
  await page.goto(encounterUrl);
  await page.waitForLoadState("networkidle");

  const startButton = page.getByRole("button", { name: "Iniciar visita" });
  const saveProgressButton = page.getByRole("button", { name: "Guardar progreso" });

  if ((await startButton.count()) === 0) {
    if ((await saveProgressButton.count()) > 0) {
      await expect(saveProgressButton).toBeVisible();
    }
    return;
  }

  await expect(startButton).toBeVisible();
  await page.getByLabel("Fecha real").fill("2026-04-02");
  await page.getByLabel("Hora real").fill("10:00");
  await startButton.click();
  await page.waitForLoadState("networkidle");
  await expect(saveProgressButton).toBeVisible();
}

async function finalizeSeededEncounter(
  page: Page,
  params: {
    encounterId: string;
    encounterUrl: string;
    clinicalNoteSentinel: string;
    performedDate: string;
    startTime: string;
    endTime: string;
  },
) {
  await startEncounterIfPlanned(page, params.encounterUrl);
  await page.goto(params.encounterUrl);
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

  await page.getByLabel("Fecha real").fill(params.performedDate);
  await page.getByLabel("Hora real de inicio").fill(params.startTime);
  await page.getByLabel("Hora real de fin").fill(params.endTime);
  await page.getByLabel("Nota clínica *").fill(params.clinicalNoteSentinel);
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
      .waitForURL((url) => !url.pathname.endsWith(`/encounters/${params.encounterId}`), { timeout: 20000 })
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

    await finalizeSeededEncounter(page, {
      encounterId: FINALIZE_BASELINE_ENCOUNTER_ID,
      encounterUrl: `/patients/${FINALIZE_BASELINE_PATIENT_ID}/encounters/${FINALIZE_BASELINE_ENCOUNTER_ID}`,
      clinicalNoteSentinel,
      performedDate: "2026-04-01",
      startTime: "07:00",
      endTime: "08:00",
    });

    await expect(page.getByText(FINALIZED_BANNER)).toBeVisible();
    await expect(page.getByText(clinicalNoteSentinel)).toBeVisible();
  });

  test("post-finalize contractual outcome A: empty-state is valid for baseline finalize seed", async ({ page }) => {
    const clinicalNoteSentinel = "E2E finalize note for patient detail empty state";

    await finalizeSeededEncounter(page, {
      encounterId: FINALIZE_BASELINE_ENCOUNTER_ID,
      encounterUrl: `/patients/${FINALIZE_BASELINE_PATIENT_ID}/encounters/${FINALIZE_BASELINE_ENCOUNTER_ID}`,
      clinicalNoteSentinel,
      performedDate: "2026-04-01",
      startTime: "07:00",
      endTime: "08:00",
    });

    await page.goto(`/patients/${FINALIZE_BASELINE_PATIENT_ID}`);

    await expect(page.getByRole("button", { name: "Completar visita" })).toHaveCount(0);
    await expect(page.getByText(EMPTY_STATE_TITLE)).toBeVisible();
    await expect(page.getByText(EMPTY_STATE_SUBTITLE)).toBeVisible();
    await expect(page.getByText(LATEST_VISIT_TITLE)).toHaveCount(0);
  });
});

test.describe("encounter finalize flow (contract contrast with active context)", () => {
  test.beforeEach(async () => {
    await loadContinuityMinimalSeed();
  });

  test("post-finalize contractual outcome B: latest visit remains visible when active context exists", async ({
    page,
  }) => {
    const clinicalNoteSentinel = "E2E finalize note with active context";

    await finalizeSeededEncounter(page, {
      encounterId: CONTINUITY_ENCOUNTER_ID,
      encounterUrl: `/patients/${CONTINUITY_PATIENT_ID}/encounters/${CONTINUITY_ENCOUNTER_ID}`,
      clinicalNoteSentinel,
      performedDate: "2026-04-02",
      startTime: "10:00",
      endTime: "10:30",
    });

    await page.goto(`/patients/${CONTINUITY_PATIENT_ID}`);
    await page.waitForLoadState("networkidle");

    await expect(page.getByText(LATEST_VISIT_TITLE)).toBeVisible();
    await expect(page.getByText(clinicalNoteSentinel)).toBeVisible();
    await expect(page.getByText(EMPTY_STATE_TITLE)).toHaveCount(0);
    await expect(page.getByText(EMPTY_STATE_SUBTITLE)).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Completar visita" })).toHaveCount(0);
    await expect(page.getByText("VISITA EN CURSO")).toHaveCount(0);
  });
});
