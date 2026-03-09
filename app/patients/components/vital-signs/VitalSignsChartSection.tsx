import React from "react";
import {
  VitalSignRecord,
  VitalSignType,
} from "../../../../domain/vital-sign-record/vital-sign-record";
import {
  groupVitalSignsByType,
  formatVitalSignLabel,
} from "../../../../lib/patient/formatters";
import { VitalSignsChart } from "./VitalSignsChart";

interface Props {
  records: VitalSignRecord[];
}

export const VitalSignsChartSection: React.FC<Props> = ({ records }) => {
  if (records.length === 0) {
    return (
      <p className="text-sm text-muted italic">
        Sin registros de signos vitales
      </p>
    );
  }

  const map = groupVitalSignsByType(records);

  const colorMap: Record<VitalSignType, string> = {
    "heart-rate": "#ef4444",
    "respiratory-rate": "#3b82f6",
    "oxygen-saturation": "#8b5cf6",
    "body-temperature": "#f97316",
    "blood-pressure": "#06b6d4",
  };

  const order: VitalSignType[] = [
    "oxygen-saturation",
    "respiratory-rate",
    "heart-rate",
    "body-temperature",
    "blood-pressure",
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {order.map((type) => {
        const data = map.get(type);
        if (!data) return null;
        if (type === "blood-pressure") {
          return (
            <VitalSignsChart
              key={type}
              title={formatVitalSignLabel(type)}
              data={data}
              lines={[
                { dataKey: "systolic", color: "#06b6d4", label: "Sistólica" },
                { dataKey: "diastolic", color: "#6366f1", label: "Diastólica" },
              ]}
            />
          );
        }
        return (
          <VitalSignsChart
            key={type}
            title={formatVitalSignLabel(type)}
            data={data}
            lines={[
              {
                dataKey: "value",
                color: colorMap[type],
                label: formatVitalSignLabel(type),
              },
            ]}
          />
        );
      })}
    </div>
  );
};
