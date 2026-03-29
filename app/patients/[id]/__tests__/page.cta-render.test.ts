import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { Encounter } from "@/domain/encounters/encounter";
import type { EpisodeOfCare } from "@/domain/episode-of-care/episode-of-care";
import type { Patient } from "@/domain/patients/patient";
import type { PatientDetailData } from "../data";

vi.mock("../../../components/Breadcrumbs", () => ({
    default: ({ patientName }: { patientName: string }) =>
        React.createElement("nav", {}, patientName),
}));

vi.mock("../components/PatientPersonalSection", () => ({
    PatientPersonalSection: () => React.createElement("section", {}, "personal"),
}));

vi.mock("../components/PatientContactSection", () => ({
    PatientContactSection: () => React.createElement("section", {}, "contact"),
}));

vi.mock("../components/EpisodeOfCareSection", () => ({
    EpisodeOfCareSection: () => React.createElement("section", {}, "episodes"),
}));

vi.mock("../components/InitialEvaluationSection", () => ({
    InitialEvaluationSection: () => React.createElement("section", {}, "initial"),
}));

vi.mock("../components/LastEncounterSection", () => ({
    LastEncounterSection: () => React.createElement("section", {}, "last-encounter"),
}));

vi.mock("../components/ReAssessmentSection", () => ({
    default: () => React.createElement("section", {}, "reassessments"),
}));

vi.mock("next/link", () => ({
    default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) =>
        React.createElement("a", { href, className }, children),
}));

vi.mock("next/navigation", () => ({
    redirect: vi.fn(),
}));

vi.mock("@/lib/patient/formatters", () => ({
    formatPatientName: () => "Ana Perez",
}));

vi.mock("@/lib/patient/formatters/encounter.formatters", () => ({
    getEncounterRepresentativeStart: () => "2026-03-28T10:00:00.000Z",
}));

vi.mock("../data", () => ({
    PatientNotFoundError: class PatientNotFoundError extends Error { },
    getPatientDetailData: vi.fn(),
}));

import Page from "../page";
import { getPatientDetailData } from "../data";

function countOccurrences(text: string, fragment: string): number {
    return text.split(fragment).length - 1;
}

function makePatient(): Patient {
    return {
        id: "pat-1",
        identifier: "123",
        name: {
            given: "Ana",
            family: "Perez",
        },
        active: true,
    };
}

function makeEpisode(status: EpisodeOfCare["status"] = "active"): EpisodeOfCare {
    return {
        id: "ep-1",
        identifier: "episode-1",
        status,
        type: ["motora"],
        startDate: "2026-03-01",
        condition: {
            code: "X",
            description: "Condition",
        },
        patientId: "pat-1",
    };
}

function makeEncounter(
    status: Encounter["status"],
    overrides: Partial<Encounter> = {},
): Encounter {
    return {
        id: `enc-${status}-1`,
        status,
        episodeOfCareId: "ep-1",
        patientId: "pat-1",
        visitType: "follow-up",
        participant: null,
        periodStart: "2026-03-28T10:00:00.000Z",
        ...overrides,
    };
}

function makePatientDetailData(overrides: Partial<PatientDetailData> = {}): PatientDetailData {
    return {
        patient: makePatient(),
        episodes: [makeEpisode()],
        lastEncounter: null,
        inProgressEncounter: null,
        nextPlannedEncounter: null,
        initialEncounter: null,
        lastEncounterProcedures: [],
        lastEncounterEvaRecords: [],
        lastEncounterVitalSigns: [],
        barthelAssessment: null,
        necpalAssessment: null,
        ecogAssessment: null,
        planOfCare: null,
        reAssessmentEntries: [],
        ...overrides,
    };
}

describe("Patient detail CTA render", () => {
    it("shows 'Registrar visita' when the patient has no encounters", async () => {
        vi.mocked(getPatientDetailData).mockResolvedValue(
            makePatientDetailData(),
        );

        const element = await Page({
            params: Promise.resolve({ id: "pat-1" }),
        });

        const html = renderToStaticMarkup(element);

        expect(html).toContain(">Planificar Visita<");
        expect(html).toContain(">Registrar visita<");
        expect(countOccurrences(html, 'href="/patients/pat-1/encounters/new"')).toBe(2);
    });

    it("shows 'Registrar visita' to /encounters/new when there is no in-progress encounter", async () => {
        vi.mocked(getPatientDetailData).mockResolvedValue(
            makePatientDetailData({
                nextPlannedEncounter: makeEncounter("planned"),
            }),
        );

        const element = await Page({
            params: Promise.resolve({ id: "pat-1" }),
        });

        const html = renderToStaticMarkup(element);

        expect(html).toContain(">Registrar Visita<");
        expect(html).toContain(">Registrar visita<");
        expect(countOccurrences(html, 'href="/patients/pat-1/encounters/new"')).toBe(1);
    });

    it("hides 'Registrar visita' when there is an in-progress encounter", async () => {
        vi.mocked(getPatientDetailData).mockResolvedValue(
            makePatientDetailData({
                inProgressEncounter: makeEncounter("in-progress"),
                lastEncounter: makeEncounter("in-progress"),
                nextPlannedEncounter: makeEncounter("planned"),
            }),
        );

        const element = await Page({
            params: Promise.resolve({ id: "pat-1" }),
        });

        const html = renderToStaticMarkup(element);

        expect(html).not.toContain(">Registrar visita<");
        expect(html).toContain(">Registrar Visita<");
        expect(html).not.toContain('href="/patients/pat-1/encounters/new"');
    });
});