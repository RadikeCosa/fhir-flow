import { expect, test, type Page } from "@playwright/test";
import { loadContinuityMinimalSeed } from "../support/load-continuity-minimal-seed";

const PATIENT_ID = "e2e-continuity-patient-1";
const ENCOUNTER_ID = "e2e-continuity-encounter-1";
const ENCOUNTER_URL = `/patients/${PATIENT_ID}/encounters/${ENCOUNTER_ID}`;

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

test("start + save-progress persists and rehydrates on reload for the same encounter", async ({ page }) => {
    await startEncounterIfPlanned(page);

    const noteSentinel = "E2E rehydrate note";
    const heartRateSentinel = "82";
    const evaSentinel = "6";

    await page.getByLabel("Nota clínica *").fill(noteSentinel);
    await page.getByLabel("Frecuencia cardíaca (lpm)").fill(heartRateSentinel);
    await page.getByLabel("Puntuación EVA").fill(evaSentinel);

    await Promise.all([
        page.waitForLoadState("networkidle"),
        page.getByRole("button", { name: "Guardar progreso" }).click(),
    ]);
    await expect(page.getByRole("status")).toContainText(
        "Progreso guardado correctamente."
    );

    await page.reload();
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(ENCOUNTER_URL);
    await expect(page.getByLabel("Nota clínica *")).toHaveValue(noteSentinel);
    await expect(page.getByLabel("Frecuencia cardíaca (lpm)")).toHaveValue(heartRateSentinel);
    await expect(page.getByLabel("Puntuación EVA")).toHaveValue(evaSentinel);
    await expect(page.getByRole("button", { name: "Finalizar visita" })).toBeVisible();
});
