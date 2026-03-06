import React from "react";
import type { VitalSignRecord } from "../../../../domain/vital-sign-record";
import { SectionCard } from "./SectionCard";
import { formatDate } from "../../../../lib/patient/formatters";

interface Props {
  record: VitalSignRecord | null;
}

export const VitalSignsSection: React.FC<Props> = ({ record }) => {
  if (!record) {
    return (
      <SectionCard title="Signos vitales">
        <p className="text-xs text-muted italic">Sin registros</p>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Signos vitales">
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        <dt className="text-xs text-muted font-medium">Fecha:</dt>
        <dd className="text-sm text-foreground">{formatDate(record.date)}</dd>

        <dt className="text-xs text-muted font-medium">Registrado por:</dt>
        <dd className="text-sm text-foreground">{record.recordedBy.display}</dd>

        {typeof record.heartRate === "number" && (
          <>
            <dt className="text-xs text-muted font-medium">Frec. cardíaca:</dt>
            <dd className="text-sm text-foreground">{`${record.heartRate} lpm`}</dd>
          </>
        )}

        {typeof record.respiratoryRate === "number" && (
          <>
            <dt className="text-xs text-muted font-medium">
              Frec. respiratoria:
            </dt>
            <dd className="text-sm text-foreground">{`${record.respiratoryRate} rpm`}</dd>
          </>
        )}

        {typeof record.oxygenSaturation === "number" && (
          <>
            <dt className="text-xs text-muted font-medium">SpO2:</dt>
            <dd className="text-sm text-foreground">{`${record.oxygenSaturation}%`}</dd>
          </>
        )}

        {typeof record.bodyTemperature === "number" && (
          <>
            <dt className="text-xs text-muted font-medium">Temperatura:</dt>
            <dd className="text-sm text-foreground">{`${record.bodyTemperature} °C`}</dd>
          </>
        )}

        {record.bloodPressure && (
          <>
            <dt className="text-xs text-muted font-medium">
              Tensión arterial:
            </dt>
            <dd className="text-sm text-foreground">{`${record.bloodPressure.systolic}/${record.bloodPressure.diastolic} mmHg`}</dd>
          </>
        )}
      </dl>
    </SectionCard>
  );
};
