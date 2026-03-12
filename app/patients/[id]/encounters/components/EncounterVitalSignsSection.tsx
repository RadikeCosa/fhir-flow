import { SectionCard } from "../../../components/detail/SectionCard";
import type { VitalSignRecord } from "../../../../../domain/vital-sign-record/vital-sign-record";
import EncounterVitalSignsValueList from "./EncounterVitalSignsValueList";

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
