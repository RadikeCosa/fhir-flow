import { SectionCard } from "../../../components/detail/SectionCard";
<<<<<<< HEAD
import type { VitalSignRecord } from "../../../../../domain/vital-sign-record/vital-sign-record";
import { formatVitalSignsForChart } from "../../../../../lib/patient/formatters/encounter-charts.formatters";
import HeartRateChart from "./charts/HeartRateChart";
import RespiratoryRateChart from "./charts/RespiratoryRateChart";
import OxygenSaturationChart from "./charts/OxygenSaturationChart";
import BodyTemperatureChart from "./charts/BodyTemperatureChart";
import BloodPressureChart from "./charts/BloodPressureChart";
=======
import type { VitalSignRecord } from "../../../../domain/vital-sign-record/vital-sign-record";
import EncounterVitalSignsValueList from "./EncounterVitalSignsValueList";
>>>>>>> 7fa17cd (se mejora vista de detalle de encounter)

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

  return (
    <SectionCard title="Signos vitales">
      <EncounterVitalSignsValueList record={records[0]} />
    </SectionCard>
  );
}
