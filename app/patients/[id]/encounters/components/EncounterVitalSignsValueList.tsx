import type { VitalSignRecord } from "../../../../../domain/vital-sign-record/vital-sign-record";
import {
  getVitalSignBadge,
  getBloodPressureBadge,
} from "../../../../../lib/patient/formatters/vital-sign.formatters";

interface Props {
  record: VitalSignRecord;
}

export default function EncounterVitalSignsValueList({ record }: Props) {
  // build a list of cards for whichever values are present
  const cards: React.ReactElement[] = [];

  if (typeof record.heartRate === "number") {
    const badge = getVitalSignBadge("heart-rate", record.heartRate);
    cards.push(
      <div
        key="heart-rate"
        className="bg-white rounded-lg shadow p-2 flex flex-col items-center"
      >
        <span className="text-xs font-semibold text-muted">Frec. cardíaca</span>
        <span className="text-lg font-bold text-foreground">
          {record.heartRate} lpm
        </span>
        <span
          className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.colorClass}`}
        >
          {badge.label}
        </span>
      </div>,
    );
  }

  if (typeof record.respiratoryRate === "number") {
    const badge = getVitalSignBadge("respiratory-rate", record.respiratoryRate);
    cards.push(
      <div
        key="respiratory-rate"
        className="bg-white rounded-lg shadow p-2 flex flex-col items-center"
      >
        <span className="text-xs font-semibold text-muted">
          Frec. respiratoria
        </span>
        <span className="text-lg font-bold text-foreground">
          {record.respiratoryRate} rpm
        </span>
        <span
          className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.colorClass}`}
        >
          {badge.label}
        </span>
      </div>,
    );
  }

  if (typeof record.oxygenSaturation === "number") {
    const badge = getVitalSignBadge(
      "oxygen-saturation",
      record.oxygenSaturation,
    );
    cards.push(
      <div
        key="oxygen-saturation"
        className="bg-white rounded-lg shadow p-2 flex flex-col items-center"
      >
        <span className="text-xs font-semibold text-muted">SpO2</span>
        <span className="text-lg font-bold text-foreground">
          {record.oxygenSaturation}%
        </span>
        <span
          className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.colorClass}`}
        >
          {badge.label}
        </span>
      </div>,
    );
  }

  if (typeof record.bodyTemperature === "number") {
    const badge = getVitalSignBadge("body-temperature", record.bodyTemperature);
    cards.push(
      <div
        key="body-temperature"
        className="bg-white rounded-lg shadow p-2 flex flex-col items-center"
      >
        <span className="text-xs font-semibold text-muted">Temperatura</span>
        <span className="text-lg font-bold text-foreground">
          {record.bodyTemperature} °C
        </span>
        <span
          className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.colorClass}`}
        >
          {badge.label}
        </span>
      </div>,
    );
  }

  if (
    record.bloodPressure &&
    typeof record.bloodPressure.systolic === "number" &&
    typeof record.bloodPressure.diastolic === "number"
  ) {
    const badge = getBloodPressureBadge(
      record.bloodPressure.systolic,
      record.bloodPressure.diastolic,
    );
    cards.push(
      <div
        key="blood-pressure"
        className="bg-white rounded-lg shadow p-2 flex flex-col items-center"
      >
        <span className="text-xs font-semibold text-muted">
          Tensión arterial
        </span>
        <span className="text-lg font-bold text-foreground">
          {record.bloodPressure.systolic} / {record.bloodPressure.diastolic}{" "}
          mmHg
        </span>
        <span
          className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.colorClass}`}
        >
          {badge.label}
        </span>
      </div>,
    );
  }

  if (cards.length === 0) {
    return null;
  }

  return <div className="grid grid-cols-2 gap-2">{cards}</div>;
}
