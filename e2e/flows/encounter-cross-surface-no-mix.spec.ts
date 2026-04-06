import { expect, test, type Page } from "@playwright/test";
import { loadCrossSurfaceNoMixSeed } from "../support/load-cross-surface-no-mix-seed";

const PATIENT_ID = "e2e-cross-surface-patient-1";
const TARGET_ENCOUNTER_ID = "e2e-cross-surface-target-encounter-1";
const SIBLING_ENCOUNTER_ID = "e2e-cross-surface-sibling-encounter-1";

const PATIENT_URL = `/patients/${PATIENT_ID}`;
const TARGET_ENCOUNTER_URL = `/patients/${PATIENT_ID}/encounters/${TARGET_ENCOUNTER_ID}`;
const HISTORY_URL = `/patients/${PATIENT_ID}/encounters`;

const SIBLING_REASON = "Motivo sibling visible E2E";
const SIBLING_NOTE = "Nota sibling visible E2E";
const PARTIAL_NOTE = "Nota parcial target E2E";
const FINAL_NOTE = "Nota final target E2E";
const FINAL_REASON = "Motivo final target E2E";

async function openTargetEncounter(page: Page) {
  await page.goto(TARGET_ENCOUNTER_URL);
  await page.waitForLoadState("networkidle");

  await expect(
    page.getByRole("button", { name: "Guardar progreso" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Finalizar visita" }),
  ).toBeVisible();
  await page.waitForFunction(() => {
    const finalizeButton = Array.from(document.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Finalizar visita"),
    );
    if (!finalizeButton) {
      return false;
    }

    return !finalizeButton.disabled;
  });
}

async function finalizeTargetEncounter(page: Page) {
  await page.getByLabel("Fecha real").fill("2026-04-03");
  await page.getByLabel("Hora real de inicio").fill("07:00");
  await page.getByLabel("Hora real de fin").fill("08:00");
  await page.getByLabel("Nota clínica *").fill(FINAL_NOTE);
  await page.getByLabel("Motivo de la visita").fill(FINAL_REASON);
  await page.getByLabel("Frecuencia cardíaca (lpm)").fill("88");
  await page.getByLabel("Frecuencia respiratoria (rpm)").fill("16");
  await page.getByLabel("Saturación oxígeno (%)").fill("98");
  await page.getByLabel("Temperatura corporal (°C)").fill("36.5");
  await page.getByLabel("Presión sistólica (mmHg)").fill("120");
  await page.getByLabel("Presión diastólica (mmHg)").fill("80");
  await page.getByLabel("Puntuación EVA").fill("2");
  await page.waitForLoadState("networkidle");

  const initialAlertText = (
    (await page
      .getByRole("alert")
      .first()
      .textContent()
      .catch(() => "")) ?? ""
  ).trim();

  await page.getByRole("button", { name: "Finalizar visita" }).click();
  await Promise.race([
    page
      .waitForURL(
        (url) => !url.pathname.endsWith(`/encounters/${TARGET_ENCOUNTER_ID}`),
        { timeout: 20000 },
      )
      .then(() => "url-changed")
      .catch(() => null),
    page
      .waitForSelector("text=Esta visita está finalizada y no puede editarse", {
        timeout: 20000,
      })
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
        return (
          currentAlertText.length > 0 && currentAlertText !== previousAlertText
        );
      },
      { previousAlertText: initialAlertText },
      { timeout: 10000 },
    )
    .then(() => "alert-changed")
    .catch(() => null);
  await Promise.race([navigationAfterClick, alertChangedAfterClick]);

  await expect(
    page.getByText("Esta visita está finalizada y no puede editarse"),
  ).toBeVisible({ timeout: 15000 });
}

test.beforeEach(async () => {
  await loadCrossSurfaceNoMixSeed();
});

test("target encounter stays isolated across detail, patient detail and history", async ({
  page,
}) => {
  await page.goto(PATIENT_URL);
  await page.waitForLoadState("networkidle");

  await expect(page.getByText("VISITA EN CURSO")).toBeVisible();
  await expect(page.getByText(PARTIAL_NOTE)).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Completar visita" }),
  ).toHaveAttribute("href", TARGET_ENCOUNTER_URL);

  await openTargetEncounter(page);
  await expect(page.getByLabel("Nota clínica *")).toHaveValue(PARTIAL_NOTE);
  await finalizeTargetEncounter(page);

  await expect(page).toHaveURL(TARGET_ENCOUNTER_URL);
  await expect(page.getByText(FINAL_NOTE)).toBeVisible();
  await expect(page.getByText(FINAL_REASON)).toBeVisible();
  await expect(page.getByText(PARTIAL_NOTE)).toHaveCount(0);
  await expect(page.getByText(SIBLING_NOTE)).toHaveCount(0);

  await page.goto(PATIENT_URL);
  await page.waitForLoadState("networkidle");

  await expect(page.getByText("ÚLTIMA VISITA")).toBeVisible();
  await expect(page.getByText(FINAL_NOTE)).toBeVisible();
  await expect(page.getByText(FINAL_REASON)).toBeVisible();
  await expect(page.getByText(PARTIAL_NOTE)).toHaveCount(0);
  await expect(page.getByText(SIBLING_NOTE)).toHaveCount(0);
  await expect(page.getByText("VISITA EN CURSO")).toHaveCount(0);

  await page.goto(HISTORY_URL);
  await page.waitForLoadState("networkidle");

  await expect(
    page.getByRole("heading", { name: "Historial de Encuentros" }),
  ).toBeVisible();
  await expect(page.getByText(FINAL_REASON)).toBeVisible();
  await expect(page.getByText(SIBLING_REASON)).toBeVisible();
  await expect(
    page.locator(
      `a[href="/patients/${PATIENT_ID}/encounters/${TARGET_ENCOUNTER_ID}"]`,
    ),
  ).toBeVisible();
  await expect(
    page.locator(
      `a[href="/patients/${PATIENT_ID}/encounters/${SIBLING_ENCOUNTER_ID}"]`,
    ),
  ).toBeVisible();
  await expect(page.getByText(PARTIAL_NOTE)).toHaveCount(0);
});

test("save -> reload/remount -> rehydrate -> finalize remains consistent across patient detail and history", async ({
  page,
}) => {
  const inProgressSavedNote = "Nota guardada target G2 continuidad";

  await openTargetEncounter(page);

  await page.getByLabel("Nota clínica *").fill(inProgressSavedNote);
  await Promise.all([
    page.waitForLoadState("networkidle"),
    page.getByRole("button", { name: "Guardar progreso" }).click(),
  ]);
  await expect(page.getByRole("status")).toContainText(
    "Progreso guardado correctamente.",
  );

  await page.reload();
  await page.waitForLoadState("networkidle");

  await expect(page).toHaveURL(TARGET_ENCOUNTER_URL);
  await expect(page.getByLabel("Nota clínica *")).toHaveValue(
    inProgressSavedNote,
  );

  await page.goto(PATIENT_URL);
  await page.waitForLoadState("networkidle");

  await expect(page.getByText("VISITA EN CURSO")).toBeVisible();
  await expect(page.getByText(inProgressSavedNote)).toBeVisible();
  await expect(page.getByText(SIBLING_NOTE)).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Completar visita" }),
  ).toHaveAttribute("href", TARGET_ENCOUNTER_URL);

  await page.goto(TARGET_ENCOUNTER_URL);
  await page.waitForLoadState("networkidle");
  await expect(page.getByLabel("Nota clínica *")).toHaveValue(
    inProgressSavedNote,
  );

  await finalizeTargetEncounter(page);

  await page.goto(HISTORY_URL);
  await page.waitForLoadState("networkidle");

  const targetEncounterLink = page.locator(
    `a[href="/patients/${PATIENT_ID}/encounters/${TARGET_ENCOUNTER_ID}"]`,
  );
  await expect(targetEncounterLink).toBeVisible();
  await targetEncounterLink.click();
  await page.waitForLoadState("networkidle");

  await expect(page).toHaveURL(TARGET_ENCOUNTER_URL);
  await expect(
    page.getByText("Esta visita está finalizada y no puede editarse"),
  ).toBeVisible();
  await expect(page.getByText(FINAL_NOTE)).toBeVisible();
  await expect(page.getByText(SIBLING_NOTE)).toHaveCount(0);
});

test("in-progress continuity survives patient detail <-> history <-> encounter detail roundtrip before finalize", async ({
  page,
}) => {
  const inProgressRoundtripNote = "Nota roundtrip in-progress global";

  await openTargetEncounter(page);
  await page.getByLabel("Nota clínica *").fill(inProgressRoundtripNote);
  await Promise.all([
    page.waitForLoadState("networkidle"),
    page.getByRole("button", { name: "Guardar progreso" }).click(),
  ]);
  await expect(page.getByRole("status")).toContainText(
    "Progreso guardado correctamente.",
  );

  await page.goto(PATIENT_URL);
  await page.waitForLoadState("networkidle");
  await expect(page.getByText("VISITA EN CURSO")).toBeVisible();
  await expect(page.getByText(inProgressRoundtripNote)).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Completar visita" }),
  ).toHaveAttribute("href", TARGET_ENCOUNTER_URL);

  await page.goto(HISTORY_URL);
  await page.waitForLoadState("networkidle");
  const targetEncounterLink = page.locator(
    `a[href="/patients/${PATIENT_ID}/encounters/${TARGET_ENCOUNTER_ID}"]`,
  );
  await expect(targetEncounterLink).toBeVisible();
  await expect(page.getByText(SIBLING_REASON)).toBeVisible();

  await targetEncounterLink.click();
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveURL(TARGET_ENCOUNTER_URL);
  await expect(page.getByLabel("Nota clínica *")).toHaveValue(
    inProgressRoundtripNote,
  );
  await expect(
    page.getByRole("button", { name: "Guardar progreso" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Finalizar visita" }),
  ).toBeVisible();
  await expect(page.getByText(SIBLING_NOTE)).toHaveCount(0);
});
