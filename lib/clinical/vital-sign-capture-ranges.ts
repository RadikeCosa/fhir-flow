export type VitalSignCaptureRange = {
    label: string;
    unit: string;
    min: number;
    max: number;
    step: number;
    helperText?: string;
};

export const VITAL_SIGN_CAPTURE_RANGES = {
    heartRate: {
        label: "Frecuencia cardíaca",
        unit: "lpm",
        min: 30,
        max: 220,
        step: 1,
        helperText: "Rango clínico: 30-220 lpm",
    },
    respiratoryRate: {
        label: "Frecuencia respiratoria",
        unit: "rpm",
        min: 5,
        max: 60,
        step: 1,
        helperText: "Rango clínico: 5-60 rpm",
    },
    oxygenSaturation: {
        label: "Saturación de oxígeno",
        unit: "%",
        min: 0,
        max: 100,
        step: 1,
        helperText: "Rango clínico: 0-100 %",
    },
    bodyTemperature: {
        label: "Temperatura corporal",
        unit: "°C",
        min: 30,
        max: 43,
        step: 0.1,
        helperText: "Rango clínico: 30.0-43.0 °C",
    },
    bloodPressureSystolic: {
        label: "Presión sistólica",
        unit: "mmHg",
        min: 60,
        max: 260,
        step: 1,
        helperText: "Rango clínico: 60-260 mmHg",
    },
    bloodPressureDiastolic: {
        label: "Presión diastólica",
        unit: "mmHg",
        min: 30,
        max: 150,
        step: 1,
        helperText: "Rango clínico: 30-150 mmHg",
    },
    evaScore: {
        label: "EVA",
        unit: "",
        min: 0,
        max: 10,
        step: 1,
        helperText: "0 = sin dolor · 10 = peor dolor imaginable",
    },
} as const;

export const EVA_HELPER_TEXT = "0 = sin dolor · 10 = peor dolor imaginable";
