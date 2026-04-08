import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("react", async (importOriginal) => {
    const actual = await importOriginal<typeof import("react")>();
    return {
        ...actual,
        useState: vi.fn(actual.useState),
    };
});

const mocks = vi.hoisted(() => ({
    useForm: vi.fn(),
    useFieldArray: vi.fn(),
    useWatch: vi.fn(),
    useRouter: vi.fn(),
    finalizeEncounterAction: vi.fn(),
    saveEncounterProgressAction: vi.fn(),
}));

vi.mock("react-hook-form", () => ({
    useForm: mocks.useForm,
    useFieldArray: mocks.useFieldArray,
    useWatch: mocks.useWatch,
}));

vi.mock("next/navigation", () => ({
    useRouter: mocks.useRouter,
}));

vi.mock("../../../actions/finalize-encounter.action", () => ({
    finalizeEncounterAction: mocks.finalizeEncounterAction,
}));

vi.mock("../../../actions/save-encounter-progress.action", () => ({
    saveEncounterProgressAction: mocks.saveEncounterProgressAction,
}));

import FinalizeEncounterForm from "../index";

const renderStateQueue: unknown[] = [];
const setStateMock = vi.fn();
const routerRefreshMock = vi.fn();

function seedRenderState(...values: unknown[]) {
    renderStateQueue.splice(0, renderStateQueue.length, ...values);
}

function buildFormMarkup() {
    return renderToStaticMarkup(
        React.createElement(FinalizeEncounterForm, {
            patientId: "patient-1",
            encounterId: "encounter-1",
            practitionerName: "Doc",
            plannedDate: "2026-03-20",
            plannedTime: "10:00",
        }),
    );
}

describe("FinalizeEncounterForm save-progress regression", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
        seedRenderState();

        vi.mocked(React.useState).mockImplementation(() => {
            const nextValue = renderStateQueue.length > 0 ? renderStateQueue.shift() : undefined;
            return [nextValue, setStateMock] as never;
        });

        mocks.useRouter.mockReturnValue({
            refresh: routerRefreshMock,
        });

        mocks.useForm.mockReturnValue({
            control: {},
            register: vi.fn((name: string) => ({
                name,
                onChange: vi.fn(),
                onBlur: vi.fn(),
                ref: vi.fn(),
            })),
            handleSubmit: vi.fn((handler: unknown) => handler),
            formState: { errors: {} },
            setValue: vi.fn(),
            getValues: vi.fn(),
            reset: vi.fn(),
        });

        mocks.useFieldArray.mockReturnValue({
            fields: [],
            append: vi.fn(),
            remove: vi.fn(),
        });

        mocks.useWatch.mockReturnValue([]);
    });

    it("shows inline success feedback for save-progress without disabling the buttons", () => {
        seedRenderState(
            null,
            "Progreso guardado correctamente.",
            null,
            false,
            true,
            true,
            true,
        );

        const html = buildFormMarkup();

        expect(html).toContain("Progreso guardado correctamente.");
        expect(html).toContain("Datos base de continuidad");
        expect(html).toContain("Editar");
        expect(html).toContain("Guardar progreso");
        expect(html).toContain("Finalizar visita");
        expect(html).not.toContain('disabled=""');
    });

    it("renders the visible save-progress fallback error banner", () => {
        seedRenderState(
            {
                success: false,
                error: {
                    layer: "fhir",
                    message: "Ocurrió un error inesperado al guardar el progreso.",
                    code: "SAVE_PROGRESS_UNEXPECTED_ERROR",
                },
            },
            null,
            null,
            false,
            true,
            true,
            true,
        );

        const html = buildFormMarkup();

        expect(html).toContain("Ocurrió un error inesperado al guardar el progreso.");
        expect(html).toContain("SAVE_PROGRESS_UNEXPECTED_ERROR");
        expect(html).not.toContain("Progreso guardado correctamente.");
    });
});
