import { SectionCard } from "../../../components/detail/SectionCard";
import type { VitalSignRecord } from "../../../../../domain/vital-sign-record/vital-sign-record";
import { formatVitalSignsForChart } from "../../../../../lib/patient/formatters/encounter-charts.formatters";
import HeartRateChart from "./charts/HeartRateChart";
import RespiratoryRateChart from "./charts/RespiratoryRateChart";
import OxygenSaturationChart from "./charts/OxygenSaturationChart";
import BodyTemperatureChart from "./charts/BodyTemperatureChart";
import BloodPressureChart from "./charts/BloodPressureChart";

interface Props {
  records: VitalSignRecord[];
}

export default function EncounterVitalSignsSection({ records }: Props) {
  if (!records || records.length === 0) {
    return (
      <SectionCard title="Signos vitales">
        <p className="text-xs text-muted">No hay registros de signos vitales</p>
      </SectionCard>
    );
  }

  const chartData = formatVitalSignsForChart(records);

  return (
    <SectionCard title="Signos vitales">
      <div className="grid grid-cols-1 gap-4">
        {chartData.heartRate.length > 0 && (
          <HeartRateChart data={chartData.heartRate} />
        )}
        {chartData.respiratoryRate.length > 0 && (
          <RespiratoryRateChart data={chartData.respiratoryRate} />
        )}
        {chartData.oxygenSaturation.length > 0 && (
          <OxygenSaturationChart data={chartData.oxygenSaturation} />
        )}
        {chartData.bodyTemperature.length > 0 && (
          <BodyTemperatureChart data={chartData.bodyTemperature} />
        )}
        {chartData.bloodPressure.length > 0 && (
          <BloodPressureChart data={chartData.bloodPressure} />
        )}
      </div>
    </SectionCard>
  );
}
